import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const posts = [{ id: '1', title: 'Need CRM', selftext: 'Hubspot is too expensive. We need an alternative.' }];

async function testIt() {
    const rawData = fs.readFileSync('server/settings.json', 'utf8');
    const settings = JSON.parse(rawData);
    const aiSettings = settings.ai || {};
    const keyToUse = aiSettings.analyzerApiKey || aiSettings.apiKey || process.env.GEMINI_API_KEY;
    const provider = aiSettings.analyzerProvider || 'google';
    const modelName = aiSettings.analyzerModel || 'gemini-1.5-flash';
    const systemPrompt = aiSettings.analyzerSystemPrompt || 'test prompt';

    console.log("Provider:", provider);
    console.log("Model:", modelName);
    console.log("Has Key:", !!keyToUse);

    try {
        if (provider === 'google') {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(keyToUse);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            console.log("Calling model...");
            const result = await model.generateContent([
                systemPrompt,
                `Posts to Analyze: ${JSON.stringify(posts)}`
            ]);
            const response = await result.response;
            console.log("Raw Response:");
            console.log(response.text());
        } else {
            console.log("Using OpenAI structure...");
            const url = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : `${aiSettings.baseUrl}/chat/completions`;
            const fetchRes = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${keyToUse}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Posts to Analyze: ${JSON.stringify(posts)}` }
                    ],
                    response_format: { type: "json_object" }
                })
            });
            const data = await fetchRes.json();
            console.log("OpenAI Response:", JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error("ERROR CAUGHT:");
        console.error(err);
    }
}
testIt();
