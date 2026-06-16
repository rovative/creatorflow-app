import { NextRequest, NextResponse } from 'next/server';
import { CreatorProfile } from '@/lib/profiles';

function buildPrompt(profile: CreatorProfile | null, topic: string | null, mode: 'brainstorm' | 'research'): string {
  const profileCtx = profile ? `
CREATOR PROFILE:
- Name: ${profile.name}
- Platforms: ${profile.platforms.join(', ')}
- Niches: ${profile.niches.join(', ')}
${profile.specificNiche ? `- Specific niche: ${profile.specificNiche}` : ''}
${profile.audienceDescription ? `- Target audience: ${profile.audienceDescription}` : ''}
${profile.creatorStyle ? `- Creator style: ${profile.creatorStyle}` : ''}
${profile.growthGoal ? `- Growth goal: ${profile.growthGoal}` : ''}
${profile.aiSummary ? `- AI summary: ${profile.aiSummary}` : ''}
`.trim() : 'No profile provided — generate general creator content opportunities.';

  const topicLine = topic ? `RESEARCH TOPIC: "${topic}"` : '';

  const modeInstruction = mode === 'brainstorm'
    ? 'Generate 6 content opportunity cards based purely on the creator profile above. Focus on evergreen ideas that would work for this creator regardless of current trends.'
    : `Generate 6 content opportunity cards${topic ? ` around the topic "${topic}"` : ''} for this creator. Make them feel timely and trend-aware, even though they are based on AI synthesis rather than live data.`;

  return `${profileCtx}

${topicLine}

${modeInstruction}

Return a JSON array of exactly 6 objects. Each object must have these exact keys:
- "opportunity": A specific, punchy title (e.g. "Football nostalgia is surging among 25-35 year olds")
- "whyItWorks": 1-2 sentences explaining why this content performs well for this niche
- "contentIdea": The exact post to make (e.g. "3 football moments Gen Z will never experience")
- "hook": A scroll-stopping opening line the creator can use verbatim
- "angle": A unique angle or perspective that makes this stand out
- "platform": Best platform(s) for this content (e.g. "TikTok" or "TikTok + Reels")

Return ONLY the JSON array. No markdown, no explanation, no code blocks. Just the raw JSON array.`;
}

export async function POST(req: NextRequest) {
  try {
    const { profile, topic, mode } = await req.json() as {
      profile?: CreatorProfile;
      topic?: string;
      mode: 'brainstorm' | 'research';
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
        max_tokens: 2000,
        system: 'You are a content strategy expert who generates highly specific, actionable content opportunities for creators. You always return valid JSON arrays with no extra text.',
        messages: [{ role: 'user', content: buildPrompt(profile ?? null, topic ?? null, mode) }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text ?? '[]';

    let cards;
    try {
      cards = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ cards });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
