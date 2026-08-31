// =====================================================================
// API client — talks to the Node/Express API (server/) which reads MySQL.
// Set VITE_API_URL in a project-root .env (e.g. http://localhost:4000/api).
// Every call fails soft: if the backend is unreachable the app keeps using
// its built-in demo data, so the UI always renders during development.
// =====================================================================
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let TOKEN = null;
export function setToken(t) { TOKEN = t; }

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

export const api = {
  list:   (resource) => req('GET', `/${resource}`),
  get:    (resource, id) => req('GET', `/${resource}/${id}`),
  create: (resource, data) => req('POST', `/${resource}`, data),
  update: (resource, id, data) => req('PUT', `/${resource}/${id}`, data),
  remove: (resource, id) => req('DELETE', `/${resource}/${id}`),
  // UI-shape endpoints (joined + aliased to the React object shapes)
  uiList:   (resource) => req('GET', `/ui/${resource}`),
  uiCreate: (resource, data) => req('POST', `/ui/${resource}`, data),
  uiUpdate: (resource, key, data) => req('PUT', `/ui/${resource}/${encodeURIComponent(key)}`, data),
  uiRemove: (resource, key) => req('DELETE', `/ui/${resource}/${encodeURIComponent(key)}`),
  patientRecord: (id) => req('GET', `/patients/${id}/record`),
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  health: () => req('GET', '/health'),
};

// Is the backend live? (used to decide DB vs demo mode)
export async function backendAvailable() {
  try { await api.health(); return true; } catch { return false; }
}
