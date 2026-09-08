// =====================================================================
// API client   talks to the real Node/Express + MySQL backend (server/).
// No demo/offline fallback: if the API is unreachable, callers surface a
// real error state rather than silently substituting fake data.
// =====================================================================
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'lefms_token';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

// Session control: a 401 on a request that WAS carrying a token means the
// session itself is no longer valid (expired, or the account was
// deactivated server-side)   not a login-form error. App.jsx subscribes
// here once at boot to force the user back to the Login screen the
// moment that happens, rather than leaving stale authenticated-looking
// UI on screen after the session has actually died.
let unauthorizedHandler = null;
export function onUnauthorized(fn) { unauthorizedHandler = fn; }

function handleResponseStatus(res, hadToken) {
  if (res.status === 401 && hadToken) unauthorizedHandler?.();
}

async function req(method, path, body) {
  const hadToken = !!getToken();
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(hadToken ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    handleResponseStatus(res, hadToken);
    throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function upload(path, formData) {
  const hadToken = !!getToken();
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { ...(hadToken ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: formData,
  });
  if (!res.ok) {
    handleResponseStatus(res, hadToken);
    throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Triggers a real browser download for a binary export (xlsx / pdf / zip).
async function download(path, options = {}) {
  const hadToken = !!getToken();
  const res = await fetch(BASE + path, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(hadToken ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    handleResponseStatus(res, hadToken);
    throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : 'export';
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  health: () => req('GET', '/health'),

  auth: {
    login: (email, password) => req('POST', '/auth/login', { email, password }),
    me: () => req('GET', '/auth/me'),
  },

  regions: () => req('GET', '/regions'),
  roles: () => req('GET', '/roles'),

  rolesAdmin: {
    modules: () => req('GET', '/roles/modules'),
    permissions: (roleId) => req('GET', `/roles/${roleId}/permissions`),
    setPermissions: (roleId, permissions) => req('PUT', `/roles/${roleId}/permissions`, { permissions }),
    create: (name) => req('POST', '/roles', { name }),
    remove: (id) => req('DELETE', `/roles/${id}`),
  },

  sites: {
    list: (params = {}) => req('GET', `/sites?${new URLSearchParams(params)}`),
    get: (id) => req('GET', `/sites/${id}`),
    create: (data) => req('POST', '/sites', data),
    update: (id, data) => req('PUT', `/sites/${id}`, data),
    remove: (id) => req('DELETE', `/sites/${id}`),
    bulkImport: (file) => { const fd = new FormData(); fd.append('file', file); return upload('/sites/bulk-import', fd); },
  },

  users: {
    list: () => req('GET', '/users'),
    engineers: () => req('GET', '/users/engineers'),
    create: (data) => req('POST', '/users', data),
    update: (id, data) => req('PUT', `/users/${id}`, data),
    remove: (id) => req('DELETE', `/users/${id}`),
  },

  assets: {
    list: (params = {}) => req('GET', `/assets?${new URLSearchParams(params)}`),
    get: (id) => req('GET', `/assets/${id}`),
    create: (data) => req('POST', '/assets', data),
    update: (id, data) => req('PUT', `/assets/${id}`, data),
    remove: (id) => req('DELETE', `/assets/${id}`),
  },

  workOrders: {
    list: (params = {}) => req('GET', `/work-orders?${new URLSearchParams(params)}`),
    get: (id) => req('GET', `/work-orders/${id}`),
    create: (data) => req('POST', '/work-orders', data),
    action: (id, action, body) => req('POST', `/work-orders/${id}/actions/${action}`, body),
    comment: (id, body) => req('POST', `/work-orders/${id}/comments`, { body }),
    remove: (id) => req('DELETE', `/work-orders/${id}`),
  },

  troubleTickets: {
    list: (params = {}) => req('GET', `/trouble-tickets?${new URLSearchParams(params)}`),
    get: (id) => req('GET', `/trouble-tickets/${id}`),
    create: (data) => req('POST', '/trouble-tickets', data),
    action: (id, action, body) => req('POST', `/trouble-tickets/${id}/actions/${action}`, body),
    createWorkOrder: (id, data) => req('POST', `/trouble-tickets/${id}/create-work-order`, data),
  },

  woChecklistTemplates: {
    list: (all) => req('GET', `/wo-checklist-templates${all ? '?all=true' : ''}`),
    create: (data) => req('POST', '/wo-checklist-templates', data),
    update: (id, data) => req('PUT', `/wo-checklist-templates/${id}`, data),
    remove: (id) => req('DELETE', `/wo-checklist-templates/${id}`),
  },

  smsGroups: {
    list: () => req('GET', '/sms-groups'),
    get: (id) => req('GET', `/sms-groups/${id}`),
    create: (data) => req('POST', '/sms-groups', data),
    update: (id, data) => req('PUT', `/sms-groups/${id}`, data),
    remove: (id) => req('DELETE', `/sms-groups/${id}`),
    addMember: (groupId, data) => req('POST', `/sms-groups/${groupId}/members`, data),
    updateMember: (memberId, data) => req('PUT', `/sms-groups/members/${memberId}`, data),
    removeMember: (memberId) => req('DELETE', `/sms-groups/members/${memberId}`),
  },

  smsConfigs: {
    list: () => req('GET', '/sms-configs'),
    create: (data) => req('POST', '/sms-configs', data),
    update: (id, data) => req('PUT', `/sms-configs/${id}`, data),
    remove: (id) => req('DELETE', `/sms-configs/${id}`),
  },

  smsLog: {
    list: (params = {}) => req('GET', `/sms-log?${new URLSearchParams(params)}`),
  },

  ehsChecklistTemplates: {
    list: (all) => req('GET', `/ehs-checklist-templates${all ? '?all=true' : ''}`),
    create: (data) => req('POST', '/ehs-checklist-templates', data),
    update: (id, data) => req('PUT', `/ehs-checklist-templates/${id}`, data),
    remove: (id) => req('DELETE', `/ehs-checklist-templates/${id}`),
  },

  ehsRecords: {
    list: (params = {}) => req('GET', `/ehs-records?${new URLSearchParams(params)}`),
    get: (id) => req('GET', `/ehs-records/${id}`),
    submit: (id, body) => req('POST', `/ehs-records/${id}/actions/submit`, body),
    review: (id, body) => req('POST', `/ehs-records/${id}/actions/review`, body),
  },

  spareItems: {
    list: (params = {}) => req('GET', `/spare-items?${new URLSearchParams(params)}`),
    get: (id) => req('GET', `/spare-items/${id}`),
    create: (data) => req('POST', '/spare-items', data),
    update: (id, data) => req('PUT', `/spare-items/${id}`, data),
    remove: (id) => req('DELETE', `/spare-items/${id}`),
    restock: (id, data) => req('POST', `/spare-items/${id}/restock`, data),
    bulkImport: (file) => { const fd = new FormData(); fd.append('file', file); return upload('/spare-items/bulk-import', fd); },
  },

  spareRequests: {
    list: (params = {}) => req('GET', `/spare-requests?${new URLSearchParams(params)}`),
    get: (id) => req('GET', `/spare-requests/${id}`),
    create: (data) => req('POST', '/spare-requests', data),
    action: (id, action, body) => req('POST', `/spare-requests/${id}/actions/${action}`, body),
  },

  spareTransactions: {
    list: (params = {}) => req('GET', `/spare-transactions?${new URLSearchParams(params)}`),
    directIssue: (data) => req('POST', '/spare-transactions/direct-issue', data),
    directReturn: (data) => req('POST', '/spare-transactions/direct-return', data),
  },

  attachments: {
    list: (entityType, entityId) => req('GET', `/attachments?entityType=${entityType}&entityId=${entityId}`),
    upload: (entityType, entityId, stage, file, historyId) => {
      const fd = new FormData();
      fd.append('entityType', entityType); fd.append('entityId', entityId); fd.append('stage', stage);
      if (historyId) fd.append('historyId', historyId);
      fd.append('file', file);
      return upload('/attachments', fd);
    },
    remove: (id) => req('DELETE', `/attachments/${id}`),
  },

  dashboard: {
    overview: (params = {}) => req('GET', `/dashboard/overview?${new URLSearchParams(params)}`),
    ehs: (params = {}) => req('GET', `/dashboard/ehs?${new URLSearchParams(params)}`),
    spares: (params = {}) => req('GET', `/dashboard/spares?${new URLSearchParams(params)}`),
    troubleTickets: (params = {}) => req('GET', `/dashboard/trouble-tickets?${new URLSearchParams(params)}`),
  },

  reports: {
    excel: (params = {}) => download(`/reports/export/excel?${new URLSearchParams(params)}`),
    ttExcel: (params = {}) => download(`/reports/export/tt-excel?${new URLSearchParams(params)}`),
    ehsExcel: (params = {}) => download(`/reports/export/ehs-excel?${new URLSearchParams(params)}`),
    sparesExcel: (params = {}) => download(`/reports/export/spares-excel?${new URLSearchParams(params)}`),
    pdf: (id) => download(`/reports/export/pdf/${id}`),
    bulkZip: (ids) => download('/reports/export/pdf/bulk', { method: 'POST', body: { ids } }),
  },
};

export const uploadsUrl = (filePath) => `${BASE.replace(/\/api$/, '')}${filePath}`;
