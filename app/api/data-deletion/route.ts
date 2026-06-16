import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function parseSignedRequest(signedRequest: string, appSecret: string) {
  const [encodedSig, payload] = signedRequest.split('.');
  if (!encodedSig || !payload) throw new Error('Invalid signed_request format');

  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const data = JSON.parse(
    Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  );

  const expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest();
  if (!crypto.timingSafeEqual(sig, expectedSig)) throw new Error('Bad signature');

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

    const body = await req.text();
    const params = new URLSearchParams(body);
    const signedRequest = params.get('signed_request');
    if (!signedRequest) return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });

    const data = parseSignedRequest(signedRequest, appSecret);
    const metaUserId: string = data.user_id ?? 'unknown';

    const confirmationCode = crypto.randomBytes(16).toString('hex');

    const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.createaflow.app'}/data-deletion?code=${confirmationCode}&uid=${metaUserId}`;

    return NextResponse.json({ url: statusUrl, confirmation_code: confirmationCode });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
