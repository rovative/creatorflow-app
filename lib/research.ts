import { supabase } from './supabase';

export interface OpportunityCard {
  id: string;
  opportunity: string;
  whyItWorks: string;
  contentIdea: string;
  hook: string;
  angle: string;
  platform: string;
  createdAt: string;
}

export async function getTopics(profileId: string): Promise<string[]> {
  const { data } = await supabase
    .from('research_topics')
    .select('topic')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(r => r.topic);
}

export async function addTopic(profileId: string, topic: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('research_topics').upsert(
    { user_id: user.id, profile_id: profileId, topic },
    { onConflict: 'user_id,profile_id,topic' }
  );
}

export async function removeTopic(profileId: string, topic: string): Promise<void> {
  await supabase.from('research_topics').delete()
    .eq('profile_id', profileId).eq('topic', topic);
}

export async function getSavedIdeas(profileId: string): Promise<OpportunityCard[]> {
  const { data } = await supabase
    .from('saved_ideas')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(r => ({
    id: r.id,
    opportunity: r.opportunity,
    whyItWorks: r.why_it_works ?? '',
    contentIdea: r.content_idea ?? '',
    hook: r.hook ?? '',
    angle: r.angle ?? '',
    platform: r.platform ?? '',
    createdAt: r.created_at,
  }));
}

export async function saveIdea(profileId: string, card: Omit<OpportunityCard, 'id' | 'createdAt'>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('saved_ideas').insert({
    user_id: user.id,
    profile_id: profileId,
    opportunity: card.opportunity,
    why_it_works: card.whyItWorks,
    content_idea: card.contentIdea,
    hook: card.hook,
    angle: card.angle,
    platform: card.platform,
  });
}

export async function deleteSavedIdea(id: string): Promise<void> {
  await supabase.from('saved_ideas').delete().eq('id', id);
}
