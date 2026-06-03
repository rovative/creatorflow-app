import { NextRequest, NextResponse } from 'next/server';
import { CreatorProfile } from '@/lib/profiles';

export async function POST(req: NextRequest) {
  try {
    const profile: CreatorProfile = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const lines: string[] = [];
    if (profile.name) lines.push(`Profile name: ${profile.name}`);
    if (profile.niches.length > 0) lines.push(`General niches: ${profile.niches.join(', ')}`);
    if (profile.specificNiche) lines.push(`Specific niche: ${profile.specificNiche}`);
    if (profile.platforms.length > 0) lines.push(`Platforms: ${profile.platforms.join(', ')}`);
    if (profile.audienceDescription) lines.push(`Audience: ${profile.audienceDescription}`);
    if (profile.creatorStyle) lines.push(`Style: ${profile.creatorStyle}`);
    if (profile.contentFormat) lines.push(`Format: ${profile.contentFormat}`);
    if (profile.growthGoal) lines.push(`Goal: ${profile.growthGoal}`);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: 'You are confirming your understanding of a content creator\'s brand and positioning. Write a 2–3 sentence summary that tells the creator: who they are, what they make, who they make it for, and what makes them specific. Start with "You create..." and be concrete — name the actual niche and audience. Avoid vague words like "great", "amazing", "various". If information is missing, focus on what you do know.',
        messages: [{
          role: 'user',
          content: `Generate a clear, specific AI understanding summary for this creator profile:\n\n${lines.join('\n')}\n\nWrite 2–3 sentences that confirm what you understand about this creator. Start with "You create..."`,
        }],
      }),
    });

    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    const data = await res.json();
    return NextResponse.json({ summary: data.content?.[0]?.text ?? '' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
