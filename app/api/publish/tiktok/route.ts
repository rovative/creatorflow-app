import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .eq('user_id', user.id)
    .single();

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (!post.media_url) return NextResponse.json({ error: 'No media attached' }, { status: 400 });
  if (!post.platforms?.includes('tiktok')) return NextResponse.json({ error: 'TikTok not selected for this post' }, { status: 400 });

  const { data: connection } = await supabase
    .from('platform_connections')
    .select('access_token')
    .eq('profile_id', post.profile_id)
    .eq('platform', 'tiktok')
    .single();

  if (!connection?.access_token) return NextResponse.json({ error: 'TikTok not connected' }, { status: 400 });

  await supabase.from('posts').update({ status: 'publishing' }).eq('id', postId);

  try {
    const videoRes = await fetch(post.media_url);
    if (!videoRes.ok) throw new Error('Failed to fetch media');
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const videoSize = videoBuffer.length;
    const chunkSize = Math.min(10 * 1024 * 1024, videoSize);
    const totalChunks = Math.ceil(videoSize / chunkSize);

    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          title: post.caption || '',
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunks,
        },
      }),
    });

    const initData = await initRes.json();
    if (initData.error?.code !== 'ok') {
      throw new Error(initData.error?.message || JSON.stringify(initData));
    }

    const { publish_id, upload_url } = initData.data;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, videoSize) - 1;
      const chunk = videoBuffer.subarray(start, end + 1);

      await fetch(upload_url, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${start}-${end}/${videoSize}`,
          'Content-Length': String(chunk.length),
          'Content-Type': 'video/mp4',
        },
        body: chunk,
      });
    }

    // Give TikTok a moment to process then check once
    await new Promise(r => setTimeout(r, 4000));
    const statusRes = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ publish_id }),
    });
    const statusData = await statusRes.json();
    const pubStatus = statusData.data?.status;

    const finalStatus = pubStatus === 'PUBLISH_COMPLETE' ? 'published' : 'publishing';
    await supabase.from('posts').update({ status: finalStatus }).eq('id', postId);

    return NextResponse.json({ success: true, publish_id, status: finalStatus });
  } catch (e) {
    await supabase.from('posts').update({ status: 'failed' }).eq('id', postId);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
