'use client';

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

const KEY = 'creatorflow_posts_v1';

export function getPosts(): ScheduledPost[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch { return []; }
}

export function savePosts(posts: ScheduledPost[]) {
  localStorage.setItem(KEY, JSON.stringify(posts));
}

export function createPost(data: Omit<ScheduledPost, 'id' | 'createdAt'>): ScheduledPost {
  const post: ScheduledPost = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  savePosts([...getPosts(), post]);
  return post;
}

export function updatePost(updated: ScheduledPost) {
  savePosts(getPosts().map(p => p.id === updated.id ? updated : p));
}

export function deletePost(id: string) {
  savePosts(getPosts().filter(p => p.id !== id));
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
