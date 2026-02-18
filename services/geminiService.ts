
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedReply, RedditPost } from "../types";

// Always use a named parameter and process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRedditReply = async (
  post: RedditPost,
  topic: string,
  tone: string,
  audience: string
): Promise<GeneratedReply> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a value-add Reddit reply for this post.
    Post Title: ${post.title}
    Post Body: ${post.selftext.substring(0, 1000)}
    Target Topic: ${topic}
    Audience Level: ${audience}
    Desired Tone: ${tone}
    
    The reply should be helpful, provide unique insights, and avoid common AI tropes.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          comment: { type: Type.STRING, description: 'The generated Reddit comment text.' },
          tone: { type: Type.STRING, description: 'The tone used in the comment.' },
          actionable_points: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Key points addressed in the reply.'
          },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Targeted keywords used for SEO/visibility.'
          }
        },
        required: ["comment", "tone", "actionable_points", "keywords"]
      },
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const text = response.text || '{}';
  return JSON.parse(text) as GeneratedReply;
};
