import { GeneratedReply, RedditPost } from "../types";

// ─── Brand Profile Helper ────────────────────────────────────────────────────
export interface BrandProfile {
  brandName?: string;
  description?: string;
  targetAudience?: string;
  problem?: string;
  website?: string;
  primaryColor?: string;
  secondaryColor?: string;
  brandTone?: string;
  customTone?: string;
}

export const fetchBrandProfile = async (userId: string | number): Promise<BrandProfile> => {
  try {
    const res = await fetch(`/api/user/brand-profile?userId=${userId}`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
};

// Merges saved profile with override fields — override wins on non-empty values
const mergeProfiles = (saved: BrandProfile, override?: Partial<BrandProfile>): BrandProfile => {
  if (!override) return saved;
  const merged: BrandProfile = { ...saved };
  (Object.keys(override) as (keyof BrandProfile)[]).forEach(key => {
    const val = override[key];
    if (val && val.trim() !== '') (merged as any)[key] = val;
  });
  return merged;
};

const buildBrandContext = (profile: BrandProfile): string => {
  if (!profile || !profile.brandName) return '';
  const tone = profile.brandTone === 'custom' && profile.customTone
    ? profile.customTone
    : profile.brandTone || 'Professional';
  return `
BRAND CONTEXT (use this to personalize the content naturally):
- Brand Name: ${profile.brandName}
- What it does: ${profile.description || 'Not specified'}
- Target Audience: ${profile.targetAudience || 'Not specified'}
- Problem it solves: ${profile.problem || 'Not specified'}
- Website: ${profile.website || 'Not specified'}
- Brand Tone: ${tone}
`;
};

const buildImageBrandContext = (profile: BrandProfile): string => {
  if (!profile || !profile.brandName) {
    return 'CRITICAL: Use Redigo brand colors ONLY: Vibrant Orange (#EA580C) for primary elements/highlights, Deep Slate Navy (#1E293B) for backgrounds/contrast, and White for text/details.';
  }
  const primary = profile.primaryColor || '#EA580C';
  const secondary = profile.secondaryColor || '#1E293B';
  return `CRITICAL VISUAL IDENTITY: Strictly use the brand colors for ${profile.brandName}: Primary Color ${primary} (use for main objects and highlights), Secondary Color ${secondary} (use for backgrounds and accents), and White. Ensure the palette is dominated by these specific hex codes to maintain brand consistency.`;
};

// ─── Generate Reddit Reply ───────────────────────────────────────────────────
export const generateRedditReply = async (
  post: RedditPost,
  topic: string,
  tone: string,
  audience: string,
  userId?: string | number,
  overrideProfile?: Partial<BrandProfile>,
  language: string = 'English'
): Promise<GeneratedReply & { credits?: number }> => {
  try {
    // Brand Logic:
    const savedProfile = userId ? await fetchBrandProfile(userId) : {};

    // Reply logic primarily uses context from the 'overrideProfile' if sent, 
    // or falls back to saved settings.
    const effectiveProfile = mergeProfiles(savedProfile, overrideProfile);
    const brandContext = buildBrandContext(effectiveProfile);

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'comment',
        prompt: `Generate a value-add Reddit reply for this post.
        Post Title: ${post.title}
        Post Body: ${post.selftext.substring(0, 1000)}
        Specific Instructions/Context: ${audience}
        Desired Tone Strategy: ${tone}
        ${brandContext}
        
        ⚠️ LANGUAGE REQUIREMENT: You MUST write the entire reply in ${language}. This is mandatory regardless of the post language.
        
        CRITICAL RULES FOR REDDIT AUTHENTICITY:
        1. NEVER start with "I'm sorry to hear that" or "That's a great question". Jump straight to the value.
        2. DO NOT sound like a typical AI assistant. Use casual but intelligent language.
        3. STYLE GUIDELINES based on Desired Tone Strategy:
           - helpful_peer: Use "I" and "Me". Talk like a friend sharing a discovery. Keep it breezy.
           - thought_leader: Use bullet points. Provide a structured "framework" or deep technical insight.
           - skeptic: Start by challenging a common assumption in the post (politely), then offer your solution as the logical alternative.
           - storyteller: Start with a brief personal anecdote or "I remember when I was struggling with..."
        4. LINK INTEGRATION: If Brand Website is provided, embed it naturally where it solves a specific pain point. Format: [BrandName](Website).
        5. NO FLUFF: Every sentence must add value or build rapport.
        6. NO CODE BLOCKS: Do NOT include any markdown code blocks (triple backticks), technical documentation style, or long variable lists. The reply must be pure conversational text, formatted for social media reading (short paragraphs).
        7. TONE CHECK: Even for 'helpful_peer' or technical topics, do NOT write like a documentation page or a tutorial with code snippets. Write like a human discussing the topic.
        
        Return STRICT JSON with keys: comment, tone, actionable_points, keywords, reddit_strategy.`,
        context: { postId: post.id, subreddit: post.subreddit }
      })
    });

    if (response.status === 402) throw new Error('OUT_OF_CREDITS');
    if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);

    const data = await response.json();
    const cleanJson = data.text.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanJson) as GeneratedReply;
    return { ...result, credits: data.credits };
  } catch (error) {
    console.error("Error generating reply via backend:", error);
    throw error;
  }
};

// ─── Generate Reddit Post ────────────────────────────────────────────────────
export const generateRedditPost = async (
  subreddit: string,
  goal: string,
  tone: string,
  productMention?: string,
  productUrl?: string,
  userId?: string | number,
  overrideProfile?: Partial<BrandProfile>,
  language: string = 'English'
): Promise<{ title: string; content: string; imagePrompt: string; credits?: number }> => {
  try {
    // Brand Logic:
    // 1. Fetch Saved Profile (Source of Truth)
    const savedProfile = userId ? await fetchBrandProfile(userId) : {};

    // 2. Prepare Override: 
    // If 'productMention' or 'productUrl' are passed as arguments (from the Quick Override or manually typed), 
    // they should be treated as overrides. If they are empty strings, they are IGNORED.
    const implicitOverride: Partial<BrandProfile> = {};
    if (productMention && productMention.trim() !== '') implicitOverride.brandName = productMention;
    if (productUrl && productUrl.trim() !== '') implicitOverride.website = productUrl;

    // 3. Merge: Saved <- Explicit Override Object <- Implicit Arguments
    // The 'overrideProfile' object comes from the advanced override panel.
    const effectiveProfile = mergeProfiles(savedProfile, { ...overrideProfile, ...implicitOverride });

    const brandContext = buildBrandContext(effectiveProfile);
    const imageColorContext = buildImageBrandContext(effectiveProfile);

    // Final logic: Use effective profile data
    const finalBrandName = effectiveProfile.brandName || '';
    const finalUrl = effectiveProfile.website || '';


    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'post',
        prompt: `Create a viral-potential Reddit post for r/${subreddit}.
        Goal: ${goal}
        Tone: ${tone}
        ${finalBrandName ? `Product/Brand to Mention: ${finalBrandName}` : ''}
        ${finalUrl ? `Product URL: ${finalUrl}` : ''}
        ${brandContext}
        
        ⚠️ LANGUAGE REQUIREMENT: You MUST write the entire post (title and content) in ${language}. This is mandatory.
        
        RULES:
        1. Write a high-engagement headline (Title).
        2. Write a detailed, value-first post body (Content). 
        3. If brand info is provided, weave it in naturally as a solution — NOT as an ad.
        4. Use Reddit formatting (bolding, spacing, line breaks).
        5. STYLE based on Tone:
           - helpful_peer: Friendly, first-person, like sharing a discovery.
           - thought_leader: Structured, bullet points, authoritative.
           - storyteller: Opens with a personal story or struggle.
           - skeptic: Challenges a common belief, then presents the solution.
        6. Return an 'imagePrompt' for a brand-consistent visual:
           - Style: Modern SaaS infographic, glassmorphism, 3D soft tech elements.
           - ${imageColorContext}
           - Theme: Visualizing the core value/insight of the post.
        
        Return STRICT JSON with keys: title, content, imagePrompt.`,
        context: { subreddit }
      })
    });

    if (response.status === 402) throw new Error('OUT_OF_CREDITS');
    if (!response.ok) throw new Error('Generation failed');

    const data = await response.json();
    const cleanJson = data.text.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanJson);
    return { ...result, credits: data.credits };
  } catch (error) {
    console.error("Error generating post:", error);
    throw error;
  }
};
