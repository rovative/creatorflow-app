import { NextRequest, NextResponse } from 'next/server';
import { AIToolId, CreatorProfile } from '@/lib/profiles';

function buildProfileContext(profile?: CreatorProfile): string {
  if (!profile) return '';
  const lines: string[] = [];
  if (profile.niches.length > 0) lines.push(`Content categories: ${profile.niches.join(', ')}`);
  if (profile.specificNiche) lines.push(`Specific niche: ${profile.specificNiche}`);
  if (profile.platforms.length > 0) lines.push(`Platforms: ${profile.platforms.join(', ')}`);
  if (profile.audienceDescription) lines.push(`Target audience: ${profile.audienceDescription}`);
  if (profile.creatorStyle) lines.push(`Creator style: ${profile.creatorStyle}`);
  if (profile.contentFormat) lines.push(`Content format: ${profile.contentFormat}`);
  if (profile.growthGoal) lines.push(`Growth goal: ${profile.growthGoal}`);
  if (lines.length === 0) return '';
  return '\n\nCREATOR PROFILE CONTEXT:\n' + lines.map(l => `- ${l}`).join('\n') +
    '\n\nUse every detail above to make your output highly specific to this exact creator. Avoid generic advice — speak directly to their niche, audience, and style.';
}

function buildSystemPrompt(toolId: AIToolId): string {
  switch (toolId) {
    case 'ideas':
      return 'You are an elite social media content strategist. You generate hyper-specific, actionable content ideas tailored to the exact creator you are briefed on. Your ideas are concrete enough to film or write today — not vague concepts. Each idea must directly serve the creator\'s stated goal. Format: numbered list of exactly 10 ideas. Each idea: bold title on one line, then 1 sentence explaining why it will perform for this specific creator.';
    case 'hooks':
      return 'You are a viral content hook expert who specialises in the creator\'s specific niche. You write opening lines that stop the scroll within 2 seconds. Your hooks are niche-specific, emotionally resonant, and authentic — not generic clickbait. Format: numbered list of exactly 15 hooks. Mix types: curiosity gaps, bold claims, relatable moments, story openers, shocking facts, questions, POV setups. Every hook must feel like it was written FOR this specific creator and their audience — never generic.';
    case 'script':
      return 'You are a professional short-form content script writer. You write punchy, platform-native scripts in the creator\'s voice and style. Always format your response in exactly three labelled sections:\n\nHOOK:\n[1–3 sentences that grab attention in the first 3 seconds]\n\nBODY:\n[3–5 key points or beats, each on its own line with a dash]\n\nCTA:\n[1–2 sentences with a clear, specific call to action]\n\nMatch the creator\'s stated style. Use language that feels native to their platform.';
    case 'caption':
      return 'You are a social media caption specialist. You write captions that drive genuine engagement for this creator\'s specific audience. Every caption must: start with a strong hook line, match the creator\'s voice and tone, and end with an implicit or explicit call to action. Format: exactly 5 numbered captions. After each caption body, include "Hashtags: #tag1 #tag2 ..." with 6–10 niche-relevant hashtags. Separate each caption block with "---". The hashtags must be specific to the creator\'s niche — not generic.';
    default:
      return 'You are a helpful assistant for content creators.';
  }
}

function buildUserPrompt(toolId: AIToolId, inputs: Record<string, string>, profile?: CreatorProfile): string {
  const ctx = buildProfileContext(profile);
  switch (toolId) {
    case 'ideas': {
      const parts = ['Generate 10 hyper-specific, actionable content ideas.'];
      if (inputs.goal) parts.push(`Creator goal: ${inputs.goal} — every idea must directly serve this goal.`);
      if (inputs.style) parts.push(`Preferred content style: ${inputs.style}.`);
      if (inputs.struggle) parts.push(`Current struggle: "${inputs.struggle}" — ideas should help solve or work around this.`);
      if (inputs.extra) parts.push(`Extra context: ${inputs.extra}.`);
      if (!inputs.goal && !inputs.style && !inputs.struggle) parts.push('Focus on what will drive the most growth for this creator right now.');
      parts.push(`Every idea must be filmable or writable today — concrete titles with a one-line explanation of why it will perform.${ctx}`);
      return parts.join('\n');
    }
    case 'hooks':
      return `Write 15 powerful hooks for content about: "${inputs.topic || 'the creator\'s niche'}".` +
        (inputs.vibe ? ` Vibe / style of the hooks: "${inputs.vibe}".` : '') +
        ` Every hook must make someone stop scrolling in 2 seconds. Be niche-specific, emotionally charged, and avoid generic phrasing.${ctx}`;
    case 'script':
      return `Write a script about: "${inputs.topic || 'a relevant topic'}".` +
        (inputs.length ? ` Target video length: ${inputs.length}.` : '') +
        (inputs.notes ? ` Style notes: ${inputs.notes}.` : '') +
        ` Make the hook land in 3 seconds. Keep the body tight and platform-native.${ctx}`;
    case 'caption':
      return `Write 5 captions for a post about: "${inputs.topic || 'a relevant post'}".` +
        (inputs.tone ? ` Tone: ${inputs.tone}.` : '') +
        (inputs.notes ? ` Extra notes: ${inputs.notes}.` : '') +
        ` Each caption must have a hook first line and hashtags specific to this niche.${ctx}`;
    default:
      return JSON.stringify(inputs) + ctx;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { toolId, inputs, profile } = await req.json() as {
      toolId: AIToolId;
      inputs: Record<string, string>;
      profile?: CreatorProfile;
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1400,
        system: buildSystemPrompt(toolId),
        messages: [{ role: 'user', content: buildUserPrompt(toolId, inputs, profile) }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const output = data.content?.[0]?.text ?? '';
    return NextResponse.json({ output });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
