const KEY = "vibe.history.v1";

export type HistoryItem = {
  id: string;
  type: "scan" | "look";
  imageUrl?: string | null;
  score?: number;
  style?: string;
  at: string;
};

export const getHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch { return []; }
};

export const pushHistory = (item: Omit<HistoryItem, "id" | "at">) => {
  const list = getHistory();
  list.unshift({ ...item, id: crypto.randomUUID(), at: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
};

export const getRecentScans = (n = 7) =>
  getHistory().filter((h) => h.type === "scan" && typeof h.score === "number").slice(0, n);

export const getStyleStats = () => {
  const looks = getHistory().filter((h) => h.type === "look" && h.style);
  const total = looks.length;
  if (!total) return [] as { style: string; count: number; pct: number }[];
  const map = new Map<string, number>();
  looks.forEach((l) => map.set(l.style!, (map.get(l.style!) ?? 0) + 1));
  return Array.from(map.entries())
    .map(([style, count]) => ({ style, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
};
