import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) return NextResponse.json({ error: 'TikTok not configured' }, { status: 500 });

  const profileId = req.nextUrl.searchParams.get('profileId');
  if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });

  const state = crypto.randomBytes(16).toString('hex');
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.createaflow.app';
  const redirectUri = `${base}/auth/callback/tiktok`;

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: 'user.info.basic',
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  });

  const response = NextResponse.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params}`
  );

  response.cookies.set('tiktok_oauth_state', JSON.stringify({ state, profileId }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
