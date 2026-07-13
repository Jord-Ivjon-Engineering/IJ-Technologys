import { getAccessToken, getSupabase } from './auth.js';
import { forceAuthExit, isAuthFailureStatus } from './sessionGuard.js';

export const CMS_VERSION_KEY = 'ij-cms-version';

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  const token = await getAccessToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = 'Bearer ' + token;

  let res;
  try {
    res = await fetch('/api/crm' + path, { ...options, headers });
  } catch {
    throw new ApiError('Network error', 0, null);
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (!options.skipAuthExit && isAuthFailureStatus(res.status)) {
      forceAuthExit();
    }
    throw new ApiError(body.error || 'Request failed', res.status, body);
  }

  maybeNotifyPublicContentUpdate(path, options.method, body);

  return body;
}

export function notifyPublicContentUpdated(version) {
  if (!version) return;
  try { localStorage.setItem(CMS_VERSION_KEY, version); } catch (e) {}
  window.postMessage({ type: 'ij-cms-content-updated', version }, window.location.origin);
}

function maybeNotifyPublicContentUpdate(path, method, body) {
  if (!body || !body.contentVersion) return;
  if (!/^\/content\/(settings|showcase|pricing|sections|refresh-cache)/.test(path)) return;
  if (!method || method === 'GET') return;
  notifyPublicContentUpdated(body.contentVersion);
}

export async function refreshPublicSiteCache() {
  const body = await crmApi.post('/content/refresh-cache');
  if (body.contentVersion) notifyPublicContentUpdated(body.contentVersion);
  return body.contentVersion;
}

export const crmApi = {
  get: (path, options) => request(path, options),
  post: (path, data, options) => request(path, { method: 'POST', body: JSON.stringify(data || {}), ...options }),
  patch: (path, data, options) => request(path, { method: 'PATCH', body: JSON.stringify(data || {}), ...options }),
  put: (path, data, options) => request(path, { method: 'PUT', body: JSON.stringify(data || {}), ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
};

export async function fetchDashboard() {
  const data = await crmApi.get('/dashboard');
  const d = data.dashboard || data.kpis || {};
  const revenue = Number(d.totalRevenue ?? d.revenueMonth ?? 0);
  const cost = Number(d.totalCost ?? d.costsMonth ?? 0);
  return {
    kpis: {
      newInbox: d.newLeads ?? d.newInbox ?? 0,
      activeProjects: d.activeProjects ?? 0,
      totalRevenue: revenue,
      totalCost: cost,
      margin: d.margin ?? (revenue - cost),
      pendingReviews: d.pendingReviews ?? 0,
      dueSoonCount: d.dueSoonCount ?? 0,
      totalClients: d.totalClients ?? 0,
    },
    recentSubmissions: data.recentSubmissions || [],
    projectsDueSoon: data.projectsDueSoon || [],
  };
}

export async function fetchClients() {
  const data = await crmApi.get('/clients');
  const clients = (data.clients || []).map((c) => ({
    ...c,
    projectCount: c.projectCount ?? 0,
  }));
  return clients;
}

export async function fetchClientDetail(id) {
  const [clientRes, projectsRes] = await Promise.all([
    crmApi.get('/clients/' + id),
    crmApi.get('/projects'),
  ]);
  const projects = (projectsRes.projects || []).filter((p) => (p.clientId || p.client?.id) === id).map(mapProject);
  return { client: clientRes.client, projects };
}

export function mapProject(p) {
  const revenue = p.agreedRevenue ?? p.revenue ?? 0;
  const cost = p.totalCost ?? p.cost ?? 0;
  return {
    ...p,
    clientName: p.client?.name || p.clientName || '',
    revenue,
    cost,
    margin: revenue - cost,
  };
}

export async function fetchProjects() {
  const data = await crmApi.get('/projects?include=costs');
  return (data.projects || []).map(mapProject);
}

export async function fetchProjectDetail(id) {
  const data = await crmApi.get('/projects/' + id + '?include=costs');
  const project = mapProject(data.project);
  return {
    project,
    costs: (data.project?.costs || []).map((c) => ({
      ...c,
      date: c.incurredAt || c.date,
    })),
  };
}

export async function fetchSubmissions() {
  const data = await crmApi.get('/submissions');
  return (data.submissions || []).map((s) => ({
    ...s,
    createdAt: s.receivedAt || s.createdAt,
    package: s.package,
  }));
}

export async function fetchReviews(status) {
  const q = status === 'published' ? 'approved' : status;
  const data = await crmApi.get('/reviews?status=' + (q || 'all'));
  return data.reviews || [];
}

export async function fetchFinance() {
  const data = await crmApi.get('/finance/summary');
  const s = data.summary || data;
  const totals = s.totals || s.summary || s;
  const byMonth = s.byMonth || s.monthly || [];
  const revByMonth = s.revenueByMonth || [];
  const monthMap = {};
  byMonth.forEach((m) => {
    monthMap[m.month] = { month: m.month, cost: Number(m.cost) || 0, revenue: 0 };
  });
  revByMonth.forEach((m) => {
    if (!monthMap[m.month]) monthMap[m.month] = { month: m.month, cost: 0, revenue: 0 };
    monthMap[m.month].revenue = Number(m.revenue) || 0;
  });
  const monthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  return {
    summary: {
      revenueYtd: totals.revenue ?? s.revenueYtd ?? 0,
      costsYtd: totals.cost ?? s.costsYtd ?? 0,
      marginYtd: totals.margin ?? s.marginYtd ?? 0,
      revenueMonth: s.revenueMonth ?? totals.revenue ?? 0,
      costsMonth: s.costsMonth ?? totals.cost ?? 0,
      marginMonth: s.marginMonth ?? totals.margin ?? 0,
    },
    monthly,
    topProjects: (s.topProjects || s.byProject || [])
      .map((p) => ({
        id: p.id,
        name: p.name,
        margin: p.margin ?? ((p.agreedRevenue || p.revenue || 0) - (p.totalCost || p.cost || 0)),
      }))
      .sort((a, b) => (b.margin || 0) - (a.margin || 0))
      .slice(0, 8),
  };
}

export async function fetchSiteSettings() {
  const data = await crmApi.get('/content/settings');
  return data.settings || {};
}

export async function saveSiteSettings(settings) {
  return crmApi.put('/content/settings', { settings });
}

export async function fetchShowcase() {
  const data = await crmApi.get('/content/showcase');
  return data.showcase || data.items || [];
}

export async function fetchPricingPlans() {
  const data = await crmApi.get('/content/pricing');
  return data.plans || [];
}

export async function fetchSections() {
  const data = await crmApi.get('/content/sections');
  return data.sections || [];
}

export async function uploadSiteImage(file) {
  if (!file) throw new ApiError('No file selected', 0, null);
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) throw new ApiError('Image must be 5 MB or smaller.', 0, null);
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (file.type && !allowed.includes(file.type)) {
    throw new ApiError('Use JPEG, PNG, WebP, or GIF.', 0, null);
  }

  const { upload } = await crmApi.post('/media/upload', { filename: file.name });
  if (!upload?.path || !upload?.token) {
    throw new ApiError('Upload URL missing from server.', 0, null);
  }

  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.storage.from('site-media').uploadToSignedUrl(
      upload.path,
      upload.token,
      file,
      { contentType: file.type || undefined }
    );
    if (error) throw new ApiError(error.message || 'Upload failed', 0, null);
    return upload.publicUrl;
  }

  const res = await fetch(upload.signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });
  if (!res.ok) throw new ApiError('Upload to storage failed', res.status, null);
  return upload.publicUrl;
}
