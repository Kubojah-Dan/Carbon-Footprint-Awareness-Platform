import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category: 'travel' | 'food' | 'energy' | 'shopping';
  kgCo2e: number;
}

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

// Rule-based fallback transaction classifier and CO₂ estimator
function classifyTransactionFallback(description: string, amount: number): {
  category: 'travel' | 'food' | 'energy' | 'shopping';
  kgCo2e: number;
} {
  const desc = description.toLowerCase();
  
  // 1. Energy
  if (
    desc.includes('gas') ||
    desc.includes('electric') ||
    desc.includes('octopus') ||
    desc.includes('british gas') ||
    desc.includes('e.on') ||
    desc.includes('eon') ||
    desc.includes('edf') ||
    desc.includes('power') ||
    desc.includes('utility')
  ) {
    return { category: 'energy', kgCo2e: Math.abs(amount) * 1.2 };
  }

  // 2. Travel
  if (
    desc.includes('uber') ||
    desc.includes('bolt') ||
    desc.includes('trainline') ||
    desc.includes('rail') ||
    desc.includes('tfl') ||
    desc.includes('transport') ||
    desc.includes('tube') ||
    desc.includes('bus') ||
    desc.includes('flight') ||
    desc.includes('airline') ||
    desc.includes('ryanair') ||
    desc.includes('easyjet') ||
    desc.includes('shell') ||
    desc.includes('bp') ||
    desc.includes('petrol') ||
    desc.includes('fuel')
  ) {
    return { category: 'travel', kgCo2e: Math.abs(amount) * 0.8 };
  }

  // 3. Food
  if (
    desc.includes('tesco') ||
    desc.includes('sainsbury') ||
    desc.includes('asda') ||
    desc.includes('waitrose') ||
    desc.includes('morrison') ||
    desc.includes('mcdonald') ||
    desc.includes('starbucks') ||
    desc.includes('restaurant') ||
    desc.includes('cafe') ||
    desc.includes('pub') ||
    desc.includes('bar') ||
    desc.includes('grocery') ||
    desc.includes('deliveroo') ||
    desc.includes('uber eats') ||
    desc.includes('food') ||
    desc.includes('bakery')
  ) {
    return { category: 'food', kgCo2e: Math.abs(amount) * 0.5 };
  }

  // 4. Shopping / Goods (Default fallback)
  return { category: 'shopping', kgCo2e: Math.abs(amount) * 0.4 };
}

// Basic CSV string parser (handles double quotes around fields containing commas)
function parseCSV(csvText: string): Array<{ date: string; description: string; amount: number }> {
  const lines = csvText.split(/\r?\n/);
  const results: Array<{ date: string; description: string; amount: number }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Split CSV line correctly accounting for quotes
    const matches = line.match(/(?!\s*$)\s*(?:"([^"]*)"|'([^']*)'|([^,]*))\s*(?:,|$)/g);
    if (!matches) continue;

    const fields = matches.map(m => {
      let f = m.trim();
      if (f.endsWith(',')) f = f.substring(0, f.length - 1).trim();
      if ((f.startsWith('"') && f.endsWith('"')) || (f.startsWith("'") && f.endsWith("'"))) {
        f = f.substring(1, f.length - 1);
      }
      return f;
    });

    // Expecting columns: Date, Description/Merchant, Amount
    const date = (fields[0] || new Date().toISOString().split('T')[0]!) as string;
    const description = (fields[1] || 'Unknown Transaction') as string;
    let amount = parseFloat(fields[2]?.replace(/[^0-9.-]/g, '') || '0');
    
    if (isNaN(amount)) amount = 0;

    results.push({ date, description, amount });
  }

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { csvText } = body;

    if (!csvText) {
      return NextResponse.json(
        { success: false, error: 'No csvText provided' },
        { status: 400 }
      );
    }

    const rawTransactions = parseCSV(csvText);
    if (rawTransactions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid transaction records found in CSV' },
        { status: 400 }
      );
    }

    const client = getGeminiClient();
    let classifiedList: ParsedTransaction[] = [];

    if (client && rawTransactions.length > 0) {
      try {
        const modelName = process.env.VERTEX_AI_MODEL ?? 'gemini-1.5-flash';
        const model = client.getGenerativeModel({ model: modelName });

        const prompt = `You are a financial transaction categorizer. Classify the following transactions into one of the 4 carbon categories: "travel", "food", "energy", "shopping". Also estimate their approximate carbon footprint in kg CO2e based on spend and category guidelines.

        Here is the JSON list of transactions:
        ${JSON.stringify(rawTransactions)}

        Respond ONLY with a valid JSON block containing an array of objects under "transactions" with matching indexes:
        {
          "transactions": [
            {
              "index": 0,
              "category": "travel|food|energy|shopping",
              "kgCo2e": estimated carbon footprint in kg CO2e (float)
            }
          ]
        }

        Do not include markdown backticks around the JSON.`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        });

        const responseText = result.response.text();
        const jsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedAI = JSON.parse(jsonText) as {
          transactions: Array<{ index: number; category: string; kgCo2e: number }>;
        };

        if (parsedAI.transactions && Array.isArray(parsedAI.transactions)) {
          classifiedList = rawTransactions.map((tx, idx) => {
            const aiMatch = parsedAI.transactions.find(t => t.index === idx);
            const category = (aiMatch?.category === 'travel' || aiMatch?.category === 'food' || aiMatch?.category === 'energy' || aiMatch?.category === 'shopping')
              ? aiMatch.category
              : classifyTransactionFallback(tx.description, tx.amount).category;
            
            const kgCo2e = aiMatch ? aiMatch.kgCo2e : classifyTransactionFallback(tx.description, tx.amount).kgCo2e;

            return {
              date: tx.date,
              description: tx.description,
              amount: tx.amount,
              category,
              kgCo2e: Math.round(kgCo2e * 10) / 10,
            };
          });
        }
      } catch (geminiError) {
        console.error('[transactions/import] Gemini API error, falling back:', geminiError);
      }
    }

    // Fallback if Gemini failed or was offline
    if (classifiedList.length === 0) {
      classifiedList = rawTransactions.map(tx => {
        const fallback = classifyTransactionFallback(tx.description, tx.amount);
        return {
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          category: fallback.category,
          kgCo2e: Math.round(fallback.kgCo2e * 10) / 10,
        };
      });
    }

    // Sum totals for convenience
    const totalKgCo2e = classifiedList.reduce((acc, curr) => acc + curr.kgCo2e, 0);
    const count = classifiedList.length;

    return NextResponse.json({
      success: true,
      count,
      totalKgCo2e: Math.round(totalKgCo2e * 10) / 10,
      transactions: classifiedList,
    });
  } catch (error: any) {
    console.error('[transactions/import] Internal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
