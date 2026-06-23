// Lightweight localStorage-backed offline cache for the coordinator dashboard.
// We cache the full guest checklist after login + a pending-checkin queue so
// the QR scanner keeps working without network.

type CachedGuest = {
  id: string;
  name: string;
  phone: string | null;
  rsvp_status: string;
  companions_count: number;
  notes: string | null;
  token: string;
  checked_in_at: string | null;
};

type PendingCheckin = { guest_id: string; guest_token: string; offline_at: string };

const GUESTS_KEY = (eventId: string) => `dawati_coord_guests::${eventId}`;
const QUEUE_KEY = (eventId: string) => `dawati_coord_queue::${eventId}`;

function safeGet<T>(key: string): T | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
function safeSet(key: string, value: unknown) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore quota / serialization */ }
}

export function cacheGuests(eventId: string, guests: CachedGuest[]) {
  safeSet(GUESTS_KEY(eventId), guests);
}
export function readCachedGuests(eventId: string): CachedGuest[] {
  return safeGet<CachedGuest[]>(GUESTS_KEY(eventId)) || [];
}
export function updateCachedGuest(eventId: string, id: string, patch: Partial<CachedGuest>) {
  const list = readCachedGuests(eventId);
  const next = list.map(g => g.id === id ? { ...g, ...patch } : g);
  cacheGuests(eventId, next);
}

export function enqueueCheckin(eventId: string, item: PendingCheckin) {
  const q = safeGet<PendingCheckin[]>(QUEUE_KEY(eventId)) || [];
  // de-dup by token within last 30s
  if (q.some(x => x.guest_token === item.guest_token)) return;
  q.push(item);
  safeSet(QUEUE_KEY(eventId), q);
}
export function readQueue(eventId: string): PendingCheckin[] {
  return safeGet<PendingCheckin[]>(QUEUE_KEY(eventId)) || [];
}
export function clearQueueItem(eventId: string, token: string) {
  const q = readQueue(eventId).filter(x => x.guest_token !== token);
  safeSet(QUEUE_KEY(eventId), q);
}
export function clearAllCaches(eventId: string) {
  try {
    localStorage.removeItem(GUESTS_KEY(eventId));
    localStorage.removeItem(QUEUE_KEY(eventId));
  } catch { /* ignore */ }
}