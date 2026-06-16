import { supabase } from './supabase';

export type SocialPlatform = 'instagram' | 'tiktok';
export type ContentType = 'video' | 'image' | 'carousel';
export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface ScheduledPost {
  id: string;
  contentType: ContentType;
  platforms: SocialPlatform[];
  caption: string;
  scheduledDate: string;
  status: PostStatus;
  mediaName?: string;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToPost(row: any): ScheduledPost {
  return {
    id: row.id,
    contentType: row.content_type,
    platforms: row.platforms ?? [],
    caption: row.caption ?? '',
    scheduledDate: row.scheduled_date,
    status: row.status,
    mediaName: row.media_name ?? undefined,
    createdAt: row.created_at,
  };
}

function postToDb(data: Omit<ScheduledPost, 'id' | 'createdAt'>) {
  return {
    content_type: data.contentType,
    platforms: data.platforms,
    caption: data.caption,
    scheduled_date: data.scheduledDate,
    status: data.status,
    media_name: data.mediaName ?? null,
  };
}

export async function getPosts(): Promise<ScheduledPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('scheduled_date', { ascending: true });
  if (error) { console.error('getPosts:', error.message); return []; }
  return (data ?? []).map(dbToPost);
}

export async function createPost(data: Omit<ScheduledPost, 'id' | 'createdAt'>): Promise<ScheduledPost | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: row, error } = await supabase
    .from('posts')
    .insert({ ...postToDb(data), user_id: user.id })
    .select()
    .single();
  if (error) { console.error('createPost:', error.message); return null; }
  return dbToPost(row);
}

export async function updatePost(updated: ScheduledPost): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update(postToDb(updated))
    .eq('id', updated.id);
  if (error) console.error('updatePost:', error.message);
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) console.error('deletePost:', error.message);
}

export function formatScheduledDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const tom = new Date(now); tom.setDate(now.getDate() + 1);
  let label: string;
  if (d.toDateString() === now.toDateString()) label = 'Today';
  else if (d.toDateString() === tom.toDateString()) label = 'Tomorrow';
  else label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${label} · ${time}`;
}
