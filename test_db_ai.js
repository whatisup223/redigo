import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const SettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
});
const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const aiLog = await Setting.findOne({ key: 'ai' });
    console.log("DB stored AI settings:", JSON.stringify(aiLog, null, 2));

    let aiSettings = aiLog ? aiLog.value : {};

    const posts = [{ id: '1', title: 'Need CRM', selftext: 'Hubspot is too expensive. We need an alternative.' }];
    const keyToUse = aiSettings.analyzerApiKey || aiSettings.apiKey || process.env.GEMINI_API_KEY;
    const provider = aiSettings.analyzerProvider || 'google';
    const modelName = aiSettings.analyzerModel || 'gemini-1.5-flash';
    const systemPrompt = aiSettings.analyzerSystemPrompt || 'test prompt';

    console.log("\nConfig checking:");
    console.log("Provider:", provider);
    console.log("Model:", modelName);
    console.log("Key to use length:", keyToUse ? keyToUse.length : 0);
    console.log("System Prompt length:", systemPrompt.length);

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
            console.log("\nRaw Response OK:");
            console.log(response.text());
        } else {
            console.log("OpenAI path...");
            // test openai
        }

    } catch (err) {
        console.error("\nError calling AI:", err);
    }
    await mongoose.disconnect();
}
check();
