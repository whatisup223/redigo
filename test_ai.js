import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testAnalyze() {
    const keyToUse = process.env.GEMINI_API_KEY; // make sure you have it in .env
    const modelName = 'gemini-1.5-flash';
    const systemPrompt = `You are an Elite Sales Intelligence Agent. Your mission is to extract high-intent sales leads from Reddit data.

CRITICAL RULES:
1. REJECT (Score 0): Any post where the author is promoting their own product, service, or 'just launched' something. We don't want to sell to competitors or self-promoters.
2. IDENTIFY (High Score): Users asking for tool recommendations, users frustrated with a specific competitor (e.g., "too expensive", "missing features"), or users asking about budget/pricing.
3. INTENT CATEGORIES: 
   - 'Switching Intent': User is unhappy with a current provider and wants to switch.
   - 'Buying Research': User is comparing tools or asking if a product is worth the cost.
   - 'Problem/Pain': User has a specific business struggle and is looking for an automated/external solution.
4. SCORING: Assign an 'opportunityScore' (0-100) based on 'Propensity to Purchase'. 100 = Ready to buy now.
5. REASONING: Provide a brief 'analysisReason' in English explaining the specific sales opportunity identified.

Return a JSON array of objects with: { "id": "post_id", "score": number, "intent": "string", "reason": "string" }`;

    const simplifiedPosts = [
        {
            id: 'test1',
            title: 'I need a good CRM software, any recommendations?',
            text: 'We are currently using HubSpot but it is too expensive for our small team. What else is out there?'
        }
    ];

    try {
        console.log("Using Key:", keyToUse ? "YES" : "NO");
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(keyToUse);
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log("Calling Gemini...");
        const result = await model.generateContent([
            systemPrompt,
            `Posts to Analyze: ${JSON.stringify(simplifiedPosts)}`
        ]);

        const response = await result.response;
        const text = response.text().trim();
        console.log("Raw Response:");
        console.log(text);

        let analysisResults = [];
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            analysisResults = JSON.parse(jsonMatch[0]);
            console.log("Parsed Array Length:", analysisResults.length);
            console.log(analysisResults);
        } else {
            console.log("No array matched.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testAnalyze();
