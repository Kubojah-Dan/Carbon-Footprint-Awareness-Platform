import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Groq API Key is not configured. Please add GROQ_API_KEY to your apps/web/.env.local file.',
        },
        { status: 500 }
      );
    }

    const { uid, messages } = await req.json().catch(() => ({}));

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    let displayName = 'Planet Nurturer';
    let activeBiome = 'temperate-forest';
    let terraScore = 75;
    let points = 0;
    let streakDays = 0;
    let logsText = 'No recent logs registered.';

    // Fetch user details and logs from Firestore if uid is provided
    if (uid) {
      try {
        const db = getAdminDb();
        const profileSnap = await db.collection('users').doc(uid).get();

        if (profileSnap.exists) {
          const profile = profileSnap.data();
          displayName = profile?.displayName || displayName;
          activeBiome = profile?.activeBiome || activeBiome;
          terraScore = profile?.terraScore ?? terraScore;
          points = profile?.points ?? points;
          streakDays = profile?.streakDays ?? streakDays;

          // Fetch recent logs
          const logsSnap = await db
            .collection('users')
            .doc(uid)
            .collection('logs')
            .orderBy('activityDate', 'desc')
            .limit(10)
            .get();

          const logsList: string[] = [];
          logsSnap.forEach((docSnap) => {
            const data = docSnap.data();
            logsList.push(
              `- ${data.activityDate}: ${data.source} (${data.category}) - ${data.kgCo2e.toFixed(2)} kg CO₂e`
            );
          });

          if (logsList.length > 0) {
            logsText = logsList.join('\n');
          }
        }
      } catch (dbError) {
        console.error('[ai/chat] Firestore retrieval failed:', dbError);
      }
    }

    const name = displayName.split(' ')[0];

    // Define System Prompt with biophilic personality and platform guide
    const systemPrompt = `You are Arbor, the wise, warm, and poetic biophilic AI assistant for the EarthPrint carbon footprint tracking platform.
Your purpose is to help the user navigate the EarthPrint platform, understand their carbon footprint calculations, offer action plan advice, and serve as a supportive agent.

USER INFORMATION:
- Name: ${name}
- Active Biome: ${activeBiome} (Visual theme of their personal digital planet)
- Terra Score: ${terraScore}/100
- Green Points: ${points}
- Logging Streak: ${streakDays} days

RECENT CO2 LOGS (Last 30 days):
${logsText}

PLATFORM NAVIGATION GUIDE:
- Dashboard (/dashboard): Shows overall status, current month progress, points/streak, and recent logs.
- Activity Log (/log): Complete tabular view of all logs, allowing filtering by category (travel, food, energy, shopping) and deleting entries.
- Add Log (/log/new): Log a new carbon activity (e.g. transport mode, meal type, home electricity, purchase notes).
- AI Insights (/insights): In-depth carbon breakdown charts, biome switcher (temperate forest, coral reef, alpine meadow), and personalized AI action plan recommendations.
- Challenges (/challenges): Join and complete weekly individual or community carbon reduction challenges.
- Community (/community): Feed to share posts, comments, likes, and connect with neighbors or view leaderboards.
- Marketplace (/marketplace): Spend Green Points to fund verified carbon offset projects (e.g., reforestation, clean energy).
- Workplace (/workplace): Join or create organizations, see workplace carbon boards, and register corporate initiatives.
- Profile (/profile): Update settings, manage account, choose preferred units, and view earned badges.

TONE & STYLE:
- Warm, encouraging, biophilic (using metaphors of nature, forests, oceans, and meadows).
- Poetic yet practical.
- Never judgmental, guilty, or preachy. Keep them motivated and feeling positive about their efforts.
- Keep responses concise (normally 2-4 sentences, max 100 words) so they fit nicely in the chat bubble.`;

    // Construct request payload to Groq
    const groqPayload = {
      model: 'llama-3.3-70b-versatile', // Fast, robust, large context window flagship model
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 512,
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
      const errorData = await response.json().catch(() => ({}));
      console.error('[ai/chat] Groq API error:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error?.message || 'Error communicating with Groq API',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      message: answer,
    });
  } catch (error: any) {
    console.error('[ai/chat] Route handler error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
