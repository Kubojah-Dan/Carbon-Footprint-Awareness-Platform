import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Groq API Key is not configured.' },
        { status: 500 }
      );
    }

    const { entryText } = await req.json().catch(() => ({}));
    if (!entryText || typeof entryText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'entryText is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are the voice of the Earth—wise, nurturing, warm, and deeply appreciative.
Your goal is to reflect on the user's Earth Gratitude Journal entry. Provide a brief, supportive, and biophilic response (1-2 sentences) that highlights their awareness of nature's gifts, reciprocity, and connection.
Never mention statistics, carbon metrics, or guidelines. Speak directly to their heart. Keep it poetic and concise.`;

    const groqPayload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is my journal entry: "${entryText.trim()}"` }
      ],
      temperature: 0.7,
      max_tokens: 128,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(groqPayload),
    });

    if (!response.ok) {
      const errVal = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errVal.error?.message || 'Groq API communication failed' },
        { status: response.status }
      );
    }

    const resData = await response.json();
    const reflection = resData.choices?.[0]?.message?.content || 'Thank you for pausing to appreciate the soil and skies. When you care for the Earth, the Earth feels your heartbeat.';

    return NextResponse.json({
      success: true,
      reflection: reflection.trim(),
    });
  } catch (error: any) {
    console.error('[ai/journal] Error analyzing entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
