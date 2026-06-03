export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube';

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

const KEY = 'cf_profiles';
const ACTIVE_KEY = 'cf_active_profile';

export function getProfiles(): CreatorProfile[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

export function getActiveProfile(): CreatorProfile | null {
  const profiles = getProfiles();
  if (profiles.length === 0) return null;
  const activeId = localStorage.getItem(ACTIVE_KEY);
  return profiles.find(p => p.id === activeId) ?? profiles[0];
}

export function setActiveProfile(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function createProfile(data: Omit<CreatorProfile, 'id' | 'createdAt'>): CreatorProfile {
  const profile: CreatorProfile = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const profiles = getProfiles();
  profiles.push(profile);
  localStorage.setItem(KEY, JSON.stringify(profiles));
  if (profiles.length === 1) setActiveProfile(profile.id);
  return profile;
}

export function updateProfile(updated: CreatorProfile) {
  const profiles = getProfiles().map(p => p.id === updated.id ? updated : p);
  localStorage.setItem(KEY, JSON.stringify(profiles));
}

export function deleteProfile(id: string) {
  const profiles = getProfiles().filter(p => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(profiles));
  const activeId = localStorage.getItem(ACTIVE_KEY);
  if (activeId === id && profiles.length > 0) setActiveProfile(profiles[0].id);
}
