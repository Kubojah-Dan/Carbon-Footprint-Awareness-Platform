import { getAdminDb } from '../lib/firebase-admin';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Service to manage all AI integration calls (Groq / Gemini) in a centralized, typed, and clean manner.
 */
export class AiService {
  private static getGroqApiKey(): string {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API Key is not configured in the server environment variables.');
    }
    return apiKey;
  }

  /**
   * General-purpose chat completion with Groq API.
   */
  public static async getGroqChatCompletion(
    messages: GroqMessage[],
    options: GroqCompletionOptions = {}
  ): Promise<string> {
    const apiKey = this.getGroqApiKey();
    const model = options.model ?? 'llama-3.3-70b-versatile';
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 128;

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errVal = await response.json().catch(() => ({}));
      throw new Error(errVal.error?.message || `Groq API returned HTTP ${response.status}`);
    }

    const resData = await response.json();
    return resData.choices?.[0]?.message?.content || '';
  }

  /**
   * Generates a weekly Carbon Haiku (5-7-5 syllables) based on user's logs for the past 7 days.
   */
  public static async generateWeeklyHaiku(uid: string): Promise<string> {
    const db = getAdminDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffIso = cutoffDate.toISOString().split('T')[0]!;

    const logsSnap = await db
      .collection('users')
      .doc(uid)
      .collection('logs')
      .where('activityDate', '>=', cutoffIso)
      .get();

    const logsList: string[] = [];
    logsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const source = (data.source as string) || 'Activity';
      const category = (data.category as string) || 'general';
      const kg = typeof data.kgCo2e === 'number' ? data.kgCo2e.toFixed(1) : '0';
      logsList.push(`${source} (${category}) - ${kg} kg CO2e`);
    });

    const logsText =
      logsList.length > 0 ? logsList.join(', ') : 'No carbon activities logged this week.';

    const systemPrompt = `You are a Zen master and poet of the biosphere. 
Your goal is to write a short, beautiful, biophilic, and non-judgmental Carbon Haiku (exactly 5-7-5 syllables) reflecting on the user's weekly carbon footprint activities.
Do not lecture or blame. Capture the essence of their footprint with nature imagery (meadows, trees, rivers, sun).
Output ONLY the haiku on a single line with slashes separating the phrases. Do not write anything else.
Example output format:
A long road hums soft / the green forest sighs in wind / tomorrow we walk`;

    const userPrompt = `Here are my carbon activities for the past 7 days:
${logsText}

Please write my weekly Carbon Haiku:`;

    const result = await this.getGroqChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        temperature: 0.8,
        maxTokens: 64,
      }
    );

    return result.replace(/"/g, '').trim();
  }

  /**
   * Generates a wise, biophilic reflection for the user's Earth Gratitude Journal entry.
   */
  public static async generateGratitudeReflection(entryText: string): Promise<string> {
    const systemPrompt = `You are the voice of the Earth—wise, nurturing, warm, and deeply appreciative.
Your goal is to reflect on the user's Earth Gratitude Journal entry. Provide a brief, supportive, and biophilic response (1-2 sentences) that highlights their awareness of nature's gifts, reciprocity, and connection.
Never mention statistics, carbon metrics, or guidelines. Speak directly to their heart. Keep it poetic and concise.`;

    const result = await this.getGroqChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is my journal entry: "${entryText.trim()}"` },
      ],
      {
        temperature: 0.7,
        maxTokens: 128,
      }
    );

    return result.trim();
  }
}
