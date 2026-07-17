import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.createaflow.app';

  if (error || !code || !state) {
    return NextResponse.redirect(`${base}/dashboard/profiles?error=tiktok_denied`);
  }

  const cookieStore = await cookies();
  const storedRaw = cookieStore.get('tiktok_oauth_state')?.value;
  if (!storedRaw) {
    return NextResponse.redirect(`${base}/dashboard/profiles?error=tiktok_state_missing`);
  }

  let profileId: string;
  try {
    const stored = JSON.parse(storedRaw);
    if (stored.state !== state) {
      return NextResponse.redirect(`${base}/dashboard/profiles?error=tiktok_state_mismatch`);
    }
    profileId = stored.profileId;
  } catch {
    return NextResponse.redirect(`${base}/dashboard/profiles?error=tiktok_state_invalid`);
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri = `${base}/auth/callback/tiktok`;

  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${base}/dashboard/profiles?error=tiktok_token_failed`);
  }

  const { access_token, refresh_token, open_id, expires_in } = tokenData;

  let username: string | null = null;
  try {
    const userRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const userData = await userRes.json();
    username = userData.data?.user?.display_name ?? null;
  } catch { /* non-fatal */ }

  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return NextResponse.redirect(`${base}/sign-in`);

  const expiresAt = new Date(Date.now() + (expires_in ?? 86400) * 1000).toISOString();

  await supabase.from('platform_connections').upsert({
    user_id: user.id,
    profile_id: profileId,
    platform: 'tiktok',
    access_token,
    refresh_token: refresh_token ?? null,
    token_expires_at: expiresAt,
    platform_user_id: open_id,
    platform_username: username,
  }, { onConflict: 'profile_id,platform' });

  const response = NextResponse.redirect(`${base}/dashboard/profiles?connected=tiktok`);
  response.cookies.delete('tiktok_oauth_state');
  return response;
}
