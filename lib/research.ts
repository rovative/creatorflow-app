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

const TOPICS_KEY = 'cf_research_topics';
const SAVED_KEY = 'cf_saved_ideas';

export function getTopics(): string[] {
  try { return JSON.parse(localStorage.getItem(TOPICS_KEY) ?? '[]'); }
  catch { return []; }
}

export function addTopic(topic: string) {
  const topics = getTopics();
  if (!topics.includes(topic)) {
    topics.unshift(topic);
    localStorage.setItem(TOPICS_KEY, JSON.stringify(topics.slice(0, 20)));
  }
}

export function removeTopic(topic: string) {
  const topics = getTopics().filter(t => t !== topic);
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
}

export function getSavedIdeas(): OpportunityCard[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]'); }
  catch { return []; }
}

export function saveIdea(card: Omit<OpportunityCard, 'id' | 'createdAt'>): OpportunityCard {
  const idea: OpportunityCard = { ...card, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const ideas = getSavedIdeas();
  ideas.unshift(idea);
  localStorage.setItem(SAVED_KEY, JSON.stringify(ideas));
  return idea;
}

export function deleteSavedIdea(id: string) {
  const ideas = getSavedIdeas().filter(i => i.id !== id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(ideas));
}
