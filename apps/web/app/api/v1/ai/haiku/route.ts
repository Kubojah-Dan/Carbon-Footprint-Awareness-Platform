import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Groq API Key is not configured.' },
        { status: 500 }
      );
    }

    const { uid } = await req.json().catch(() => ({}));
    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'User ID (uid) is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffIso = cutoffDate.toISOString().split('T')[0]!;

    const logsSnap = await db.collection('users').doc(uid).collection('logs')
      .where('activityDate', '>=', cutoffIso)
      .get();

    const logsList: string[] = [];
    logsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      logsList.push(`${data.source} (${data.category}) - ${data.kgCo2e.toFixed(1)} kg CO2e`);
    });

    const logsText = logsList.length > 0 
      ? logsList.join(', ')
      : 'No carbon activities logged this week.';

    const systemPrompt = `You are a Zen master and poet of the biosphere. 
Your goal is to write a short, beautiful, biophilic, and non-judgmental Carbon Haiku (exactly 5-7-5 syllables) reflecting on the user's weekly carbon footprint activities.
Do not lecture or blame. Capture the essence of their footprint with nature imagery (meadows, trees, rivers, sun).
Output ONLY the haiku on a single line with slashes separating the phrases. Do not write anything else.
Example output format:
A long road hums soft / the green forest sighs in wind / tomorrow we walk`;

    const userPrompt = `Here are my carbon activities for the past 7 days:
${logsText}

Please write my weekly Carbon Haiku:`;

    const groqPayload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 64,
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
    const haiku = resData.choices?.[0]?.message?.content || 'Green leaves brush the wind / Soft footsteps upon the moss / Earth breathes and resets';

    return NextResponse.json({
      success: true,
      haiku: haiku.replace(/"/g, '').trim(),
    });
  } catch (error: any) {
    console.error('[ai/haiku] Error generating haiku:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
