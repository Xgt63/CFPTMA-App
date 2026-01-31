// Utilities for tracking recents and favorites
export type RecentItem = { id: string; label: string; path: string; when: string; kind: 'staff'|'theme'|'evaluation' };
export type FavoriteItem = { id: string; label: string; path: string; kind: 'staff'|'theme'|'evaluation' };

const RECENTS_KEY = 'ui.recents';
const FAVS_KEY = 'ui.favorites';

export function addRecent(item: Omit<RecentItem,'when'>) {
  try {
    const list: RecentItem[] = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
    const withoutDup = list.filter(x => x.id !== item.id).slice(0, 49);
    const newList = [{ ...item, when: new Date().toISOString() }, ...withoutDup];
    localStorage.setItem(RECENTS_KEY, JSON.stringify(newList));
  } catch {}
}

export function getRecents(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); } catch { return []; }
}

export function toggleFavorite(item: FavoriteItem) {
  try {
    const list: FavoriteItem[] = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]');
    const exists = list.find(x => x.id === item.id);
    const newList = exists ? list.filter(x => x.id !== item.id) : [item, ...list].slice(0, 100);
    localStorage.setItem(FAVS_KEY, JSON.stringify(newList));
  } catch {}
}

export function getFavorites(): FavoriteItem[] {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'); } catch { return []; }
}
