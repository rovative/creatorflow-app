import { supabase } from './supabase';

export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube';
export type AIToolId = 'ideas' | 'hooks' | 'script' | 'caption';

export interface CreatorProfile {
  id: string;
  name: string;
  emoji: string;
  platforms: SocialPlatform[];
  niches: string[];
  specificNiche?: string;
  audienceDescription?: string;
  creatorStyle?: string;
  contentFormat?: string;
  growthGoal?: string;
  aiSummary?: string;
  createdAt: string;
}

const ACTIVE_KEY = 'cf_active_profile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToProfile(row: any): CreatorProfile {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji ?? '🎬',
    platforms: row.platforms ?? [],
    niches: row.niches ?? [],
    specificNiche: row.specific_niche ?? undefined,
    audienceDescription: row.audience_description ?? undefined,
    creatorStyle: row.creator_style ?? undefined,
    contentFormat: row.content_format ?? undefined,
    growthGoal: row.growth_goal ?? undefined,
    aiSummary: row.ai_summary ?? undefined,
    createdAt: row.created_at,
  };
}

function profileToDb(data: Omit<CreatorProfile, 'id' | 'createdAt'>) {
  return {
    name: data.name,
    emoji: data.emoji,
    platforms: data.platforms,
    niches: data.niches,
    specific_niche: data.specificNiche ?? null,
    audience_description: data.audienceDescription ?? null,
    creator_style: data.creatorStyle ?? null,
    content_format: data.contentFormat ?? null,
    growth_goal: data.growthGoal ?? null,
    ai_summary: data.aiSummary ?? null,
  };
}

export async function getProfiles(): Promise<CreatorProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('getProfiles:', error.message); return []; }
  return (data ?? []).map(dbToProfile);
}

export async function getActiveProfile(): Promise<CreatorProfile | null> {
  const profiles = await getProfiles();
  if (profiles.length === 0) return null;
  const activeId = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_KEY) : null;
  return profiles.find(p => p.id === activeId) ?? profiles[0];
}

export function setActiveProfile(id: string) {
  if (typeof window !== 'undefined') localStorage.setItem(ACTIVE_KEY, id);
}

export async function createProfile(data: Omit<CreatorProfile, 'id' | 'createdAt'>): Promise<CreatorProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: row, error } = await supabase
    .from('profiles')
    .insert({ ...profileToDb(data), user_id: user.id })
    .select()
    .single();
  if (error) { console.error('createProfile:', error.message); return null; }
  const profile = dbToProfile(row);
  if (typeof window !== 'undefined' && !localStorage.getItem(ACTIVE_KEY)) {
    setActiveProfile(profile.id);
  }
  return profile;
}

export async function updateProfile(updated: CreatorProfile): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(profileToDb(updated))
    .eq('id', updated.id);
  if (error) console.error('updateProfile:', error.message);
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) console.error('deleteProfile:', error.message);
  if (typeof window !== 'undefined' && localStorage.getItem(ACTIVE_KEY) === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}
