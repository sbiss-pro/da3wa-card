export type CoordSession = { coordinator_id: string; event_id: string; name: string; session_token: string };
const KEY = "dawati_coordinator_session";
export function saveCoordSession(s: CoordSession) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
export function getCoordSession(): CoordSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as CoordSession : null;
  } catch { return null; }
}
export function clearCoordSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}