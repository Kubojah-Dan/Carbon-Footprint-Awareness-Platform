import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminDb } from '@/lib/firebase-admin';
import type { UserProfile, LogEntry } from '@earthprint/types';

type BiomeType = 'temperate-forest' | 'coral-reef' | 'alpine-meadow';

const FALLBACK_NUDGES: Record<BiomeType, Record<string, string>> = {
  'temperate-forest': {
    travel: `The canopy of your forest is quiet today. A few less car rides could clear the woodland air and invite back the bluebirds. What if we try walking or public transit for your next trip?`,
    food: `I notice your forest stream is running a bit warm. Shifting a couple of meals to plant-based choices can cool the waters and help the forest ferns grow tall and green.`,
    energy: `Your forest oaks are breathing deep, but the power lines hum. Turning off unused appliances can quiet the hum and let the fireflies light up the forest glade tonight.`,
    shopping: `Your forest floor is getting cluttered. Choosing a second-hand item or skipping a delivery purchase can keep the soil healthy and let the wildflowers poke through.`,
  },
  'coral-reef': {
    travel: `The water clarity of your reef has dropped slightly. Less driving will help clear the skies and keep the ocean water sparkling and bright for the clownfish.`,
    food: `I hear a quiet buzz in your reef. Shifting to plant-based meals can keep the ocean current cool, protecting the delicate coral tips from losing their colors.`,
    energy: `The coral polyps are resting, but the energy grid hums through the tides. Saving power at home helps keep the reef currents running cool and clean.`,
    shopping: `Your reef has new structures, but the sea anemones need space to float. Buying second-hand keeps plastics and emissions away from your ocean home.`,
  },
  'alpine-meadow': {
    travel: `The mountain air in your meadow is a bit misty today. Walking or cycling for your next trip will clear the mist and let the snow peaks shine in full view.`,
    food: `Your meadow wildflowers are waiting to bloom. Trying a plant-rich lunch will nourish the soil and invite the honeybees to make sweet meadow honey.`,
    energy: `The mountain stream runs fast, but the power use is high. Turning down the heating or using energy-saving settings keeps your alpine flowers safe from late frost.`,
    shopping: `Your meadow has many boxes, but the marmots prefer open grassy fields. Limiting new purchases preserves the wild, untamed beauty of your alpine home.`,
  },
};

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { uid, displayName, activeBiome, terraScore, categoryBreakdown } = body;

    let profile: UserProfile | null = null;
    let recentLogs: LogEntry[] = [];

    // Attempt to load from Firestore if uid is supplied
    if (uid) {
      try {
        const db = getAdminDb();
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
          profile = doc.data() as UserProfile;
          displayName = displayName || profile.displayName;
          activeBiome = activeBiome || profile.activeBiome;
          terraScore = terraScore || profile.terraScore;
          
          // Get recent logs
          const logsSnap = await db.collection('users').doc(uid).collection('logs')
            .orderBy('activityDate', 'desc')
            .limit(10)
            .get();
            
          logsSnap.forEach((d: any) => {
            recentLogs.push(d.data() as LogEntry);
          });
        }
      } catch (dbError) {
        console.error('[ai/coach] Firestore load failed, using request data:', dbError);
      }
    }

    // Default configuration variables
    const name = displayName?.split(' ')[0] || 'Planet Nurturer';
    const biome: BiomeType = activeBiome || 'temperate-forest';
    const score = terraScore || 75;
    
    // Categorize emissions
    let travel = categoryBreakdown?.travel || 0;
    let food = categoryBreakdown?.food || 0;
    let energy = categoryBreakdown?.energy || 0;
    let shopping = categoryBreakdown?.shopping || 0;

    if (recentLogs.length > 0) {
      travel = recentLogs.filter(l => l.category === 'travel').reduce((acc, curr) => acc + curr.kgCo2e, 0);
      food = recentLogs.filter(l => l.category === 'food').reduce((acc, curr) => acc + curr.kgCo2e, 0);
      energy = recentLogs.filter(l => l.category === 'energy').reduce((acc, curr) => acc + curr.kgCo2e, 0);
      shopping = recentLogs.filter(l => l.category === 'shopping').reduce((acc, curr) => acc + curr.kgCo2e, 0);
    }

    // Identify highest category
    const categories = { travel, food, energy, shopping };
    const highestCategory = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'travel';

    let coachMessage = '';
    let isFallback = true;

    const client = getGeminiClient();

    if (client) {
      try {
        const modelName = process.env.VERTEX_AI_MODEL ?? 'gemini-1.5-flash';
        const model = client.getGenerativeModel({ model: modelName });

        const prompt = `You are Arbor, the wise and gentle biophilic climate coach from the EarthPrint platform.
        You communicate in a warm, poetic, and encouraging tone. You never use guilt or shame; you talk about carbon reduction in terms of nurturing a living digital ecosystem.
        
        USER CONTEXT:
        - Name: ${name}
        - Chosen Biome Avatar: ${biome} (e.g. temperate-forest = oaks, river, bluebirds; coral-reef = sea turtles, reef water clarity, clownfish; alpine-meadow = mountain wildflowers, marmots, streams)
        - Terra Score: ${score}/100 (high is healthy, low means stressed)
        - Recent Category Emissions: Travel: ${travel.toFixed(1)} kg, Food: ${food.toFixed(1)} kg, Energy: ${energy.toFixed(1)} kg, Shopping: ${shopping.toFixed(1)} kg CO2e
        - Highest emission category: ${highestCategory}
        
        Write a brief behavioral nudge (2-3 sentences, maximum 60 words).
        Incorporate metaphors matching their chosen biome and highest emission category.
        For example:
        - If biome is temperate-forest and travel is high: "The canopy of your forest is quiet... let's walk tomorrow."
        - If biome is coral-reef and food is high: "Let's try a plant-rich dinner to cool the reef waters..."
        
        Respond with ONLY the coach's message string inside quotes, no extra formatting or instructions.`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 256 },
        });

        const text = result.response.text().trim();
        if (text) {
          // Strip out quotes
          coachMessage = text.replace(/^"|"$/g, '');
          isFallback = false;
        }
      } catch (geminiError) {
        console.error('[ai/coach] Gemini call failed, using biophilic template:', geminiError);
      }
    }

    if (!coachMessage) {
      const biomeTemplates = FALLBACK_NUDGES[biome] || FALLBACK_NUDGES['temperate-forest'];
      const template = (biomeTemplates[highestCategory] || biomeTemplates.travel || "The ecosystem calls; let's tread lightly today.") as string;
      coachMessage = `"${template.replace(/Alex/g, name)}"`;
    }

    return NextResponse.json({
      success: true,
      coach: {
        name: 'Arbor, The Planet Whisperer',
        message: coachMessage,
        biomeUsed: biome,
        highestCategory,
        isFallback,
      },
    });
  } catch (error: any) {
    console.error('[ai/coach] Internal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
