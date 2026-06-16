/**
 * Vertex AI / Gemini API Client
 *
 * Google Service: Vertex AI / Gemini API
 * Used for: AI personalization engine — generates tailored carbon reduction recommendations
 *
 * Phase 1: Uses @google/generative-ai SDK (Gemini API) with API key.
 *           Easier to set up than full Vertex AI service account credentials.
 *           Swap to @google-cloud/vertexai in Phase 2 for production Vertex AI.
 *
 * Model: gemini-1.5-pro (configurable via VERTEX_AI_MODEL env var)
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { AIRecommendation, UserProfile, OnboardingAnswers } from '@earthprint/types';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. ' +
      'Get an API key at https://aistudio.google.com/app/apikey and add it to .env.local'
    );
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

function getGeminiModel(): GenerativeModel {
  if (model) return model;
  const modelName = process.env.VERTEX_AI_MODEL ?? 'gemini-1.5-flash';
  model = getGeminiClient().getGenerativeModel({ model: modelName });
  return model;
}

export interface RecommendationRequest {
  userProfile: UserProfile;
  onboardingAnswers: OnboardingAnswers;
  baselineKgCo2ePerYear: number;
  categoryBreakdown: {
    travel: number;
    food: number;
    energy: number;
    shopping: number;
  };
  previousTipFeedback?: Array<{
    title: string;
    feedback: 'helpful' | 'not-relevant';
  }>;
}

/**
 * Generate 3 personalized carbon reduction recommendations using Gemini.
 *
 * The prompt is structured to produce actionable, empowering recommendations
 * that are specific to this user's lifestyle, constraints, and biggest emission sources.
 *
 * Recommendations are:
 *   - Ranked by monthly CO₂ saving impact
 *   - Filtered by feasibility for this specific user
 *   - Framed positively (progress, not guilt)
 */
export async function generateRecommendations(
  request: RecommendationRequest
): Promise<AIRecommendation[]> {
  const { userProfile, onboardingAnswers, baselineKgCo2ePerYear, categoryBreakdown, previousTipFeedback } = request;

  const biggestCategory = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'travel';

  const prompt = buildRecommendationPrompt({
    userProfile,
    onboardingAnswers,
    baselineKgCo2ePerYear,
    categoryBreakdown,
    biggestCategory,
    previousTipFeedback: previousTipFeedback ?? [],
  });

  try {
    const geminiModel = getGeminiModel();
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as { recommendations: RawRecommendation[] };

    return parsed.recommendations.map((rec, index) =>
      mapToAIRecommendation(rec, index)
    );
  } catch (error) {
    console.error('[vertex-ai] Failed to generate recommendations:', error);
    // Return graceful fallback recommendations
    return getFallbackRecommendations(biggestCategory, categoryBreakdown);
  }
}

interface RawRecommendation {
  title: string;
  description: string;
  category: string;
  monthly_co2_saving_kg: number;
  effort_level: string;
  cost_impact: string;
  reasoning: string;
  action_url?: string;
}

function mapToAIRecommendation(raw: RawRecommendation, index: number): AIRecommendation {
  return {
    id: `ai-rec-${Date.now()}-${index}`,
    title: raw.title,
    description: raw.description,
    category: validateCategory(raw.category),
    monthlyCo2Saving: Math.max(0, raw.monthly_co2_saving_kg),
    effortLevel: validateEffort(raw.effort_level),
    costImpact: validateCostImpact(raw.cost_impact),
    reasoning: raw.reasoning,
    actionUrl: raw.action_url,
    generatedAt: new Date().toISOString(),
    userFeedback: null,
  };
}

function validateCategory(cat: string): AIRecommendation['category'] {
  const valid = ['travel', 'food', 'energy', 'shopping', 'systemic'];
  return valid.includes(cat) ? (cat as AIRecommendation['category']) : 'travel';
}

function validateEffort(effort: string): AIRecommendation['effortLevel'] {
  const valid = ['low', 'medium', 'high'];
  return valid.includes(effort) ? (effort as AIRecommendation['effortLevel']) : 'medium';
}

function validateCostImpact(cost: string): AIRecommendation['costImpact'] {
  const valid = ['saves-money', 'cost-neutral', 'small-cost', 'significant-cost'];
  return valid.includes(cost) ? (cost as AIRecommendation['costImpact']) : 'cost-neutral';
}

function buildRecommendationPrompt(params: {
  userProfile: UserProfile;
  onboardingAnswers: OnboardingAnswers;
  baselineKgCo2ePerYear: number;
  categoryBreakdown: Record<string, number>;
  biggestCategory: string;
  previousTipFeedback: Array<{ title: string; feedback: string }>;
}): string {
  const { onboardingAnswers, baselineKgCo2ePerYear, categoryBreakdown, biggestCategory, previousTipFeedback } = params;
  const { location, household, transport, diet, shopping } = onboardingAnswers;

  const previousFeedbackText = previousTipFeedback.length > 0
    ? `\n\nPrevious recommendations the user marked as NOT RELEVANT (do not repeat these types):\n${previousTipFeedback.filter(t => t.feedback === 'not-relevant').map(t => `- "${t.title}"`).join('\n')}`
    : '';

  return `You are EarthPrint's carbon reduction AI. Generate exactly 3 personalized, actionable carbon reduction recommendations for this user.

USER PROFILE:
- Location: ${location.city}, ${location.countryName}
- Household: ${household.size} people, ${household.dwellingType}, ${household.heatingType} heating
- Car: ${transport.hasCarOrVan ? `${transport.vehicleFuelType} car, ${transport.weeklyCarKm} km/week` : 'No car'}
- Public transport: ${transport.weeklyPublicTransportKm} km/week
- Flights per year: ${transport.flightsPerYear} short-haul, ${transport.longHaulFlightsPerYear} long-haul
- Diet: ${diet.dietType} (${diet.organicPercent}% organic, ${diet.localFoodPercent}% local)
- Shopping: fast fashion = "${shopping.fastFashionFrequency}", ${shopping.newElectronicsPerYear} new electronics/year
- Budget level: ${shopping.budgetLevel}

CURRENT ANNUAL FOOTPRINT:
- Total: ${Math.round(baselineKgCo2ePerYear)} kg CO₂e/year
- Travel: ${Math.round(categoryBreakdown['travel'] ?? 0)} kg CO₂e/year
- Food: ${Math.round(categoryBreakdown['food'] ?? 0)} kg CO₂e/year
- Energy: ${Math.round(categoryBreakdown['energy'] ?? 0)} kg CO₂e/year
- Shopping: ${Math.round(categoryBreakdown['shopping'] ?? 0)} kg CO₂e/year
- Biggest emission source: ${biggestCategory}
${previousFeedbackText}

REQUIREMENTS FOR RECOMMENDATIONS:
1. Focus on the user's biggest emission sources first
2. Be specific to their location, household size, and constraints
3. Use empowering, positive language — no guilt or shame
4. Each recommendation must be genuinely actionable for this specific person
5. Monthly CO₂ saving must be realistic and calculated from their actual footprint
6. Effort level: low = change needs no significant lifestyle disruption; medium = some habit change needed; high = major lifestyle change
7. Cost impact: saves-money / cost-neutral / small-cost (<£50/year) / significant-cost (>£50/year)
8. Do NOT suggest: flying less if they have 0 flights; going vegan if they're already vegan; buying an EV if they have no car

Respond ONLY with valid JSON in this exact format:
{
  "recommendations": [
    {
      "title": "Short action title (max 8 words)",
      "description": "2-3 sentences: what to do, why it helps, practical first step. Positive, specific, empowering.",
      "category": "travel|food|energy|shopping|systemic",
      "monthly_co2_saving_kg": 12.5,
      "effort_level": "low|medium|high",
      "cost_impact": "saves-money|cost-neutral|small-cost|significant-cost",
      "reasoning": "1 sentence explaining why this was recommended for this specific user",
      "action_url": "https://... (optional — only include if there's a genuinely useful external URL)"
    }
  ]
}`;
}

/** Fallback recommendations used when Gemini API is unavailable */
function getFallbackRecommendations(
  biggestCategory: string,
  breakdown: Record<string, number>
): AIRecommendation[] {
  const now = new Date().toISOString();

  const fallbacks: AIRecommendation[] = [
    {
      id: `fallback-1-${Date.now()}`,
      title: 'Switch to a green energy tariff',
      description:
        'Switching your home electricity to a renewable tariff can reduce your energy emissions by up to 100%. Many providers offer competitive rates with no contract lock-in. Search "green energy tariff" + your postcode to compare options.',
      category: 'energy',
      monthlyCo2Saving: Math.round((breakdown['energy'] ?? 1200) / 12 * 0.7),
      effortLevel: 'low',
      costImpact: 'cost-neutral',
      reasoning: 'Switching energy tariff is one of the highest-impact, lowest-effort actions available.',
      generatedAt: now,
      userFeedback: null,
    },
    {
      id: `fallback-2-${Date.now()}`,
      title: 'Try 3 plant-based meals this week',
      description:
        "Replacing 3 meat meals with plant-based alternatives could save 15–20 kg CO₂e per month. Start with meals you already enjoy — pasta with tomato sauce, vegetable curry, or bean tacos are easy wins.",
      category: 'food',
      monthlyCo2Saving: Math.round((breakdown['food'] ?? 1700) / 12 * 0.15),
      effortLevel: 'low',
      costImpact: 'saves-money',
      reasoning: 'Reducing meat consumption is typically the highest-impact food change available.',
      generatedAt: now,
      userFeedback: null,
    },
    {
      id: `fallback-3-${Date.now()}`,
      title: 'Buy one item second-hand this month',
      description:
        "Second-hand shopping reduces clothing emissions by up to 95% vs. buying new. Apps like Vinted, Depop, or your local charity shop are great places to start. Your next clothing purchase could save 20–50 kg CO₂e.",
      category: 'shopping',
      monthlyCo2Saving: Math.round((breakdown['shopping'] ?? 800) / 12 * 0.3),
      effortLevel: 'low',
      costImpact: 'saves-money',
      reasoning: 'Consumer goods are a significant and often overlooked emission source.',
      generatedAt: now,
      userFeedback: null,
    },
  ];

  // Sort by biggest category impact first
  const categoryOrder = [biggestCategory, 'travel', 'food', 'energy', 'shopping'];
  return fallbacks.sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a.category);
    const bIdx = categoryOrder.indexOf(b.category);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
}
