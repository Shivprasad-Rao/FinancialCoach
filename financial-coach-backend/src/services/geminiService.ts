import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { Insight } from '../types';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

// Cache: Key -> { timestamp, data: { insights, advice } }
const cache = new Map<string, { timestamp: number, data: { insights: Insight[], advice: string } }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function generateCombinedAnalysis(context: any): Promise<{ insights: Insight[], advice: string }> {
    if (!API_KEY) {
        return getMockAnalysis('Missing API Key');
    }

    const cacheKey = JSON.stringify(context);
    const cached = cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log('Returning cached combined analysis');
        return cached.data;
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            You are a smart, fun, witty, and slightly sassy financial coach. 
            Your goal is to "Spotlight" the most critical financial behaviors using the provided data.

            Input Data:
            ${JSON.stringify(context, null, 2)}

            INSTRUCTIONS:
            1. **Prioritize ML Findings**: If 'ml_findings.anomaly' or 'ml_findings.burn_rate' exist, these MUST be your first insights.
               - For Anomalies: Be dramatic but helpful. (e.g., "Whoa! $500 at 'Target'? Did you buy the whole store?")
               - For Burn Rate: Be a stern but encouraging coach. (e.g., "You're burning cash like a bonfire. Cool it down.")
            2. **General Insights**: Fill the remaining spots (up to 3 total) with other observations (Subscriptions, massive coffee spend, etc.).
            3. **Advice**: A short, punchy, empathy-sandwich paragraph.

            Output Schema (JSON):
            {
                "insights": [
                    {
                        "id": string (unique),
                        "type": "alert" | "suggestion" | "achievement",
                        "title": string (Hooky title),
                        "message": string (Witty, 1-2 sentences),
                        "impact_amount": number (The related amount)
                    }
                ],
                "advice": string
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        const analysis = {
            insights: data.insights || [],
            advice: data.advice || "Keep tracking your spending!"
        };

        // Cache It
        cache.set(cacheKey, { timestamp: Date.now(), data: analysis });
        if (cache.size > 50) cache.clear();

        return analysis;

    } catch (error: any) {
        if (error.status === 429 || error.message?.includes('429')) {
            console.warn('Gemini quota exceeded (Combined). Returning fallback.');
            return getMockAnalysis('Rate Limit Exceeded', true);
        }
        console.error('Gemini Combined Analysis Error:', error);
        return getMockAnalysis('Error');
    }
}

// Deprecated: Kept for backward compatibility but should be avoided to save calls
export async function getFinancialAdvice(context: string): Promise<string> {
    return "Please use generateCombinedAnalysis for optimized API usage.";
}

// Deprecated: Kept for backward compatibility
export async function generateDynamicInsights(context: any): Promise<Insight[]> {
    const result = await generateCombinedAnalysis(context);
    return result.insights;
}

function getMockAnalysis(reason: string, isQuota: boolean = false): { insights: Insight[], advice: string } {
    return {
        insights: [
            {
                id: 'mock_alert',
                type: 'alert',
                title: isQuota ? 'System Busy' : 'Demo Mode (Alert)',
                message: isQuota ? 'My brain needs a break (Rate Limit). Here are standard tips.' : 'Add an API Key to see real AI insights.',
                impact_amount: 0
            },
            {
                id: 'mock_suggestion',
                type: 'suggestion',
                title: 'Try the 50/30/20 Rule',
                message: 'Allocate 50% to needs, 30% to wants, and 20% to savings for better balance.',
                impact_amount: 0
            },
            {
                id: 'mock_achievement',
                type: 'achievement',
                title: 'Spending Streak',
                message: 'You have tracked 5 transactions this week. Consistency is key!',
                impact_amount: 0
            }
        ],
        advice: isQuota
            ? "I'm a bit overwhelmed right now (Rate Limit). Try again later, but remember: the best way to save is to track every dollar!"
            : "I can't generate specific advice without an API key, but generally, trying to save 20% of your income is a great goal!"
    };
}
