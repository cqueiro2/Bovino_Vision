export interface PendingAnalysis {
  id: string;
  imageData: string;
  createdAt: string;
}

const STORAGE_KEY = 'bovino-vision.pending-analyses';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getPendingAnalyses(): PendingAnalysis[] {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PendingAnalysis[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function setPendingAnalyses(items: PendingAnalysis[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function enqueuePendingAnalysis(imageData: string) {
  const items = getPendingAnalyses();
  const newItem: PendingAnalysis = {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    imageData,
    createdAt: new Date().toISOString()
  };
  items.push(newItem);
  setPendingAnalyses(items);
  return newItem;
}

export function removePendingAnalysis(id: string) {
  const items = getPendingAnalyses().filter((item) => item.id !== id);
  setPendingAnalyses(items);
}

export function clearPendingAnalyses() {
  setPendingAnalyses([]);
}
