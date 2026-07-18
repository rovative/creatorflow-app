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
    return NextResponse.redirect(`${base}/dashboard/profiles?error=instagram_denied`);
  }

  const cookieStore = await cookies();
  const storedRaw = cookieStore.get('instagram_oauth_state')?.value;
  if (!storedRaw) {
    return NextResponse.redirect(`${base}/dashboard/profiles?error=instagram_state_missing`);
  }

  let profileId: string;
  try {
    const stored = JSON.parse(storedRaw);
    if (stored.state !== state) {
      return NextResponse.redirect(`${base}/dashboard/profiles?error=instagram_state_mismatch`);
    }
    profileId = stored.profileId;
  } catch {
    return NextResponse.redirect(`${base}/dashboard/profiles?error=instagram_state_invalid`);
  }

  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = `${base}/auth/callback/instagram`;

  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }).toString(),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${base}/dashboard/profiles?error=instagram_token_failed`);
  }

  const { access_token, user_id } = tokenData;

  let username: string | null = null;
  try {
    const userRes = await fetch(
      `https://graph.instagram.com/v22.0/${user_id}?fields=id,name,username&access_token=${access_token}`
    );
    const userData = await userRes.json();
    username = userData.username ?? null;
  } catch { /* non-fatal */ }

  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return NextResponse.redirect(`${base}/sign-in`);

  await supabase.from('platform_connections').upsert({
    user_id: user.id,
    profile_id: profileId,
    platform: 'instagram',
    access_token,
    platform_user_id: String(user_id),
    platform_username: username,
  }, { onConflict: 'profile_id,platform' });

  const response = NextResponse.redirect(`${base}/dashboard/profiles?connected=instagram`);
  response.cookies.delete('instagram_oauth_state');
  return response;
}
