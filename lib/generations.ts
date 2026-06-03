export type AIToolId = 'ideas' | 'hooks' | 'script' | 'caption';

export const TOOL_LABELS: Record<AIToolId, string> = {
  ideas: 'Ideas',
  hooks: 'Hooks',
  script: 'Script',
  caption: 'Caption',
};

export interface SavedGeneration {
  id: string;
  toolId: AIToolId;
  toolLabel: string;
  profileId: string;
  inputs: Record<string, string>;
  output: string;
  createdAt: string;
}

const KEY = 'cf_generations';

export function getGenerations(): SavedGeneration[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

export function saveGeneration(data: Omit<SavedGeneration, 'id' | 'createdAt'>): SavedGeneration {
  const gen: SavedGeneration = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const all = getGenerations();
  all.unshift(gen);
  localStorage.setItem(KEY, JSON.stringify(all));
  return gen;
}

export function deleteGeneration(id: string) {
  localStorage.setItem(KEY, JSON.stringify(getGenerations().filter(g => g.id !== id)));
}
