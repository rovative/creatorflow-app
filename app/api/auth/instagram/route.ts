import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId) return NextResponse.json({ error: 'Instagram not configured' }, { status: 500 });

  const profileId = req.nextUrl.searchParams.get('profileId');
  if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });

  const state = crypto.randomBytes(16).toString('hex');
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.createaflow.app';
  const redirectUri = `${base}/auth/callback/instagram`;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'instagram_business_basic,instagram_business_content_publish',
    response_type: 'code',
    state,
  });

  const response = NextResponse.redirect(
    `https://www.instagram.com/oauth/authorize?${params}`
  );

  response.cookies.set('instagram_oauth_state', JSON.stringify({ state, profileId }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
