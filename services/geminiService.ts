import { GeneratedReply, RedditPost } from "../types";

export const generateRedditReply = async (
  post: RedditPost,
  topic: string,
  tone: string,
  audience: string
): Promise<GeneratedReply> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Generate a value-add Reddit reply for this post.
        Post Title: ${post.title}
        Post Body: ${post.selftext.substring(0, 1000)}
        Target Topic: ${topic}
        Audience Level: ${audience}
        Desired Tone: ${tone}
        
        The reply should be helpful, provide unique insights, and avoid common AI tropes. Return STRICT JSON with keys: comment, tone, actionable_points, keywords.`,
        context: { postId: post.id, subreddit: post.subreddit }
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    const text = data.text;

    // Clean up potential markdown code blocks if the AI returns them
    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();

    return JSON.parse(cleanJson) as GeneratedReply;
  } catch (error) {
    console.error("Error generating reply via backend:", error);
    throw error;
  }
};
