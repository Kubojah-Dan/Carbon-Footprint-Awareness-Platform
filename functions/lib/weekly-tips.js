"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateWeeklyTips = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const emission_engine_1 = require("@earthprint/emission-engine");
// Initialize firebase-admin if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Scheduled Cloud Function (v2): Runs every Monday at 00:00 UTC.
 * Regenerates Gemini tips for all active users who have completed onboarding.
 */
exports.regenerateWeeklyTips = (0, scheduler_1.onSchedule)({
    schedule: '0 0 * * 1', // Every Monday at midnight
    timeZone: 'UTC',
    memory: '512MiB',
    timeoutSeconds: 300,
    // Access the Gemini API key from environment variables or Google Secret Manager
    secrets: ['GEMINI_API_KEY'],
}, async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY secret is not set.');
        return;
    }
    const db = admin.firestore();
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const modelName = process.env.VERTEX_AI_MODEL ?? 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
        // 1. Fetch all users who completed onboarding
        const usersSnap = await db
            .collection('users')
            .where('onboardingCompleted', '==', true)
            .get();
        console.log(`Processing weekly recommendations for ${usersSnap.size} users...`);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        const cutoffIso = cutoffDate.toISOString().split('T')[0];
        for (const userDoc of usersSnap.docs) {
            const uid = userDoc.id;
            const profile = userDoc.data();
            if (!profile.onboardingAnswers) {
                console.warn(`User ${uid} has onboardingCompleted but no onboardingAnswers.`);
                continue;
            }
            try {
                // 2. Fetch logs for the past 30 days to calculate breakdown
                const logsSnap = await db
                    .collection('users')
                    .doc(uid)
                    .collection('logs')
                    .where('activityDate', '>=', cutoffIso)
                    .get();
                const categoryBreakdown = {
                    travel: 0,
                    food: 0,
                    energy: 0,
                    shopping: 0,
                };
                let hasLogs = false;
                logsSnap.forEach((doc) => {
                    const log = doc.data();
                    const cat = log.category;
                    if (cat in categoryBreakdown && typeof log.kgCo2e === 'number') {
                        categoryBreakdown[cat] += log.kgCo2e;
                        hasLogs = true;
                    }
                });
                // Fall back to baseline monthly breakdown if no logs
                if (!hasLogs) {
                    const baselineResult = (0, emission_engine_1.calculateBaseline)(profile.onboardingAnswers);
                    categoryBreakdown.travel = baselineResult.byCategory.travel / 12;
                    categoryBreakdown.food = baselineResult.byCategory.food / 12;
                    categoryBreakdown.energy = baselineResult.byCategory.energy / 12;
                    categoryBreakdown.shopping = baselineResult.byCategory.shopping / 12;
                }
                // 3. Fetch previous recommendations for feedback exclusion
                const recsRef = db.collection('users').doc(uid).collection('recommendations');
                const recsSnap = await recsRef.get();
                const previousTipFeedback = [];
                recsSnap.forEach((doc) => {
                    const data = doc.data();
                    if (data.title && (data.userFeedback === 'helpful' || data.userFeedback === 'not-relevant')) {
                        previousTipFeedback.push({
                            title: data.title,
                            feedback: data.userFeedback,
                        });
                    }
                });
                // 4. Construct AI Prompt
                const prompt = buildRecommendationPrompt({
                    profile,
                    categoryBreakdown,
                    previousTipFeedback,
                });
                // 5. Generate with Gemini
                const aiResult = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        responseMimeType: 'application/json',
                    },
                });
                const responseText = aiResult.response.text();
                const parsed = JSON.parse(responseText);
                const mappedRecommendations = parsed.recommendations.map((rec, index) => ({
                    id: `ai-rec-${Date.now()}-${index}`,
                    title: rec.title,
                    description: rec.description,
                    category: rec.category,
                    monthlyCo2Saving: Math.max(0, rec.monthly_co2_saving_kg),
                    effortLevel: rec.effort_level,
                    costImpact: rec.cost_impact,
                    reasoning: rec.reasoning,
                    actionUrl: rec.action_url,
                    generatedAt: new Date().toISOString(),
                    userFeedback: null,
                }));
                // 6. Write in batch
                const batch = db.batch();
                mappedRecommendations.forEach((rec) => {
                    batch.set(recsRef.doc(rec.id), rec);
                });
                await batch.commit();
                console.log(`Successfully updated weekly recommendations for user ${uid}`);
            }
            catch (err) {
                console.error(`Failed to generate recommendations for user ${uid}:`, err);
            }
        }
        console.log('Weekly tips regeneration job complete.');
    }
    catch (err) {
        console.error('Error during weekly tips scheduled run:', err);
    }
});
function buildRecommendationPrompt(params) {
    const { profile, categoryBreakdown, previousTipFeedback } = params;
    const answers = profile.onboardingAnswers;
    const { location, household, transport, diet, shopping } = answers;
    const biggestCategory = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'travel';
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

CURRENT FOOTPRINT ESTIMATES:
- Total: ${Math.round(profile.baselineKgCo2ePerYear || 4800)} kg CO₂e/year
- Travel: ${Math.round(categoryBreakdown['travel'] ?? 0)} kg CO₂e/month
- Food: ${Math.round(categoryBreakdown['food'] ?? 0)} kg CO₂e/month
- Energy: ${Math.round(categoryBreakdown['energy'] ?? 0)} kg CO₂e/month
- Shopping: ${Math.round(categoryBreakdown['shopping'] ?? 0)} kg CO₂e/month
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
//# sourceMappingURL=weekly-tips.js.map