import api from './axios';

// ---------- Auth ----------
export const authApi = {
  registerCompany: (payload) => api.post('/auth/register-company', payload),
  login: (payload) => api.post('/auth/login', payload),
  getMe: () => api.get('/auth/me'),
};

// ---------- Leads ----------
export const leadsApi = {
  list: (params) => api.get('/leads', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (payload) => api.post('/leads', payload),
  update: (id, payload) => api.put(`/leads/${id}`, payload),
  remove: (id) => api.delete(`/leads/${id}`),
  bulkDelete: (ids) => api.post('/leads/bulk-delete', { ids }),
  bulkAssign: (ids, assignedTo) => api.post('/leads/bulk-assign', { ids, assignedTo }),
  addActivity: (id, payload) => api.post(`/leads/${id}/activity`, payload),
  whatsapp: (id, message) => api.post(`/leads/${id}/whatsapp`, { message }),
  email: (id, payload) => api.post(`/leads/${id}/email`, payload),
  mark: (id, action, reason) => api.post(`/leads/${id}/mark`, { action, reason }),
  filterMeta: () => api.get('/leads/filters/meta'),
};

// ---------- Scraper ----------
export const scraperApi = {
  start: (payload) => api.post('/scraper/start', payload),
  stop: (id) => api.post(`/scraper/${id}/stop`),
  pause: (id) => api.post(`/scraper/${id}/pause`),
  resume: (id) => api.post(`/scraper/${id}/resume`),
  listJobs: () => api.get('/scraper/jobs'),
  getJob: (id) => api.get(`/scraper/${id}`),
};

// ---------- Meetings ----------
export const meetingsApi = {
  list: (params) => api.get('/meetings', { params }),
  get: (id) => api.get(`/meetings/${id}`),
  create: (payload) => api.post('/meetings', payload),
  update: (id, payload) => api.put(`/meetings/${id}`, payload),
  remove: (id) => api.delete(`/meetings/${id}`),
};

// ---------- Proposals ----------
export const proposalsApi = {
  list: (params) => api.get('/proposals', { params }),
  get: (id) => api.get(`/proposals/${id}`),
  create: (formData) =>
    api.post('/proposals', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) =>
    api.put(`/proposals/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/proposals/${id}`),
  downloadUrl: (id) => `${api.defaults.baseURL}/proposals/${id}/download`,
};

// ---------- Follow-ups ----------
export const followUpsApi = {
  list: () => api.get('/followups'),
  create: (payload) => api.post('/followups', payload),
  update: (id, payload) => api.put(`/followups/${id}`, payload),
  remove: (id) => api.delete(`/followups/${id}`),
};

// ---------- Pipeline ----------
export const pipelineApi = {
  get: () => api.get('/pipeline'),
  move: (leadId, status) => api.patch(`/pipeline/${leadId}/move`, { status }),
};

// ---------- Analytics / Dashboard ----------
export const analyticsApi = {
  dashboard: () => api.get('/dashboard'),
  analytics: () => api.get('/analytics'),
};

// ---------- Users ----------
export const usersApi = {
  list: () => api.get('/users'),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
};

// ---------- Settings ----------
export const settingsApi = {
  get: () => api.get('/settings'),
  updateProfile: (payload) => api.put('/settings/profile', payload),
  updateStatuses: (statuses) => api.put('/settings/statuses', { statuses }),
  updateCategories: (categories) => api.put('/settings/categories', { categories }),
  upsertEmailTemplate: (payload) => api.post('/settings/email-templates', payload),
  deleteEmailTemplate: (name) => api.delete(`/settings/email-templates/${encodeURIComponent(name)}`),
  upsertWhatsAppTemplate: (payload) => api.post('/settings/whatsapp-templates', payload),
  deleteWhatsAppTemplate: (name) =>
    api.delete(`/settings/whatsapp-templates/${encodeURIComponent(name)}`),
};
