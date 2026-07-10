'use strict';

const { supabase } = require('./supabase');

function clientFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    status: row.status,
    source: row.source,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function clientToRow(item) {
  const row = {};
  if (item.name !== undefined) row.name = item.name;
  if (item.company !== undefined) row.company = item.company;
  if (item.email !== undefined) row.email = item.email;
  if (item.phone !== undefined) row.phone = item.phone;
  if (item.status !== undefined) row.status = item.status;
  if (item.source !== undefined) row.source = item.source;
  if (item.notes !== undefined) row.notes = item.notes;
  if (item.updatedAt !== undefined) row.updated_at = item.updatedAt;
  return row;
}

function projectFromRow(row) {
  if (!row) return null;
  const out = {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    status: row.status,
    packageTier: row.package_tier,
    quotedAmount: Number(row.quoted_amount),
    agreedRevenue: Number(row.agreed_revenue),
    totalCost: Number(row.total_cost),
    startDate: row.start_date,
    dueDate: row.due_date,
    showcaseFeatured: row.showcase_featured,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.clients) {
    out.client = clientFromRow(row.clients);
  }
  if (row.project_costs) {
    out.costs = row.project_costs.map(costFromRow);
  }
  return out;
}

function projectToRow(item) {
  const row = {};
  if (item.clientId !== undefined) row.client_id = item.clientId;
  if (item.name !== undefined) row.name = item.name;
  if (item.status !== undefined) row.status = item.status;
  if (item.packageTier !== undefined) row.package_tier = item.packageTier;
  if (item.quotedAmount !== undefined) row.quoted_amount = item.quotedAmount;
  if (item.agreedRevenue !== undefined) row.agreed_revenue = item.agreedRevenue;
  if (item.startDate !== undefined) row.start_date = item.startDate;
  if (item.dueDate !== undefined) row.due_date = item.dueDate;
  if (item.showcaseFeatured !== undefined) row.showcase_featured = item.showcaseFeatured;
  if (item.notes !== undefined) row.notes = item.notes;
  if (item.updatedAt !== undefined) row.updated_at = item.updatedAt;
  return row;
}

function costFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.project_id,
    label: row.label,
    amount: Number(row.amount),
    category: row.category,
    incurredAt: row.incurred_at,
    createdAt: row.created_at,
  };
}

function costToRow(item) {
  const row = {};
  if (item.projectId !== undefined) row.project_id = item.projectId;
  if (item.label !== undefined) row.label = item.label;
  if (item.amount !== undefined) row.amount = item.amount;
  if (item.category !== undefined) row.category = item.category;
  if (item.incurredAt !== undefined) row.incurred_at = item.incurredAt;
  return row;
}

function submissionFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    package: row.package,
    status: row.status,
    clientId: row.client_id,
    ip: row.ip,
    userAgent: row.user_agent,
    receivedAt: row.received_at,
  };
}

function submissionToRow(item) {
  const row = {};
  if (item.name !== undefined) row.name = item.name;
  if (item.email !== undefined) row.email = item.email;
  if (item.message !== undefined) row.message = item.message;
  if (item.package !== undefined) row.package = item.package;
  if (item.status !== undefined) row.status = item.status;
  if (item.clientId !== undefined) row.client_id = item.clientId;
  return row;
}

function normalizeBilingual(val) {
  if (val == null || val === '') return { en: '', sq: '' };
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return { en: parsed.en || '', sq: parsed.sq || '' };
        }
      } catch {}
    }
    return { en: val, sq: val };
  }
  if (typeof val === 'object') {
    return { en: val.en || '', sq: val.sq || '' };
  }
  return { en: '', sq: '' };
}

function showcaseFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    sortOrder: row.sort_order,
    tag: normalizeBilingual(row.tag),
    title: normalizeBilingual(row.title),
    description: normalizeBilingual(row.description),
    imageUrl: row.image_url,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function showcaseToRow(item) {
  const row = {};
  if (item.sortOrder !== undefined) row.sort_order = item.sortOrder;
  if (item.tag !== undefined) row.tag = normalizeBilingual(item.tag);
  if (item.title !== undefined) row.title = normalizeBilingual(item.title);
  if (item.description !== undefined) row.description = normalizeBilingual(item.description);
  if (item.imageUrl !== undefined) row.image_url = item.imageUrl;
  if (item.published !== undefined) row.published = item.published;
  if (item.updatedAt !== undefined) row.updated_at = item.updatedAt;
  if (item.updatedBy !== undefined) row.updated_by = item.updatedBy;
  return row;
}

function pricingFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: normalizeBilingual(row.name),
    priceLabel: row.price_label,
    perLabel: normalizeBilingual(row.per_label),
    features: row.features || [],
    highlighted: row.highlighted,
    sortOrder: row.sort_order,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function pricingToRow(item) {
  const row = {};
  if (item.slug !== undefined) row.slug = item.slug;
  if (item.name !== undefined) row.name = normalizeBilingual(item.name);
  if (item.priceLabel !== undefined) {
    row.price_label = typeof item.priceLabel === 'object'
      ? (item.priceLabel.en || item.priceLabel.sq || '')
      : item.priceLabel;
  }
  if (item.perLabel !== undefined) row.per_label = normalizeBilingual(item.perLabel);
  if (item.features !== undefined) row.features = item.features;
  if (item.highlighted !== undefined) row.highlighted = item.highlighted;
  if (item.sortOrder !== undefined) row.sort_order = item.sortOrder;
  if (item.published !== undefined) row.published = item.published;
  if (item.updatedAt !== undefined) row.updated_at = item.updatedAt;
  if (item.updatedBy !== undefined) row.updated_by = item.updatedBy;
  return row;
}

function sectionFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    enabled: row.enabled,
    sortOrder: row.sort_order,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sectionToRow(item) {
  const row = {};
  if (item.slug !== undefined) row.slug = item.slug;
  if (item.enabled !== undefined) row.enabled = item.enabled;
  if (item.sortOrder !== undefined) row.sort_order = item.sortOrder;
  if (item.content !== undefined) row.content = item.content;
  if (item.updatedAt !== undefined) row.updated_at = item.updatedAt;
  if (item.updatedBy !== undefined) row.updated_by = item.updatedBy;
  return row;
}

async function getDashboardStats() {
  const { data, error } = await supabase.rpc('crm_dashboard_stats');
  if (error) throw error;
  return data;
}

async function getRecentSubmissions(limit = 5) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('id, name, email, status, received_at')
    .order('received_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(submissionFromRow);
}

async function getProjectsDueSoon(days = 14, limit = 5) {
  const today = new Date().toISOString().slice(0, 10);
  const until = new Date();
  until.setDate(until.getDate() + days);
  const untilStr = until.toISOString().slice(0, 10);
  const { data, count, error } = await supabase
    .from('crm_projects')
    .select('id, name, due_date, status, clients(name)', { count: 'exact' })
    .not('due_date', 'is', null)
    .gte('due_date', today)
    .lte('due_date', untilStr)
    .in('status', ['active', 'scoping', 'review'])
    .order('due_date', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return {
    count: count ?? 0,
    items: (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      dueDate: row.due_date,
      status: row.status,
      clientName: row.clients?.name || '',
    })),
  };
}

async function getDashboardPage() {
  const [stats, recentSubmissions, dueSoon] = await Promise.all([
    getDashboardStats(),
    getRecentSubmissions(5),
    getProjectsDueSoon(14, 5),
  ]);
  return { stats, recentSubmissions, dueSoon };
}

async function getFinanceSummary() {
  const { data, error } = await supabase.rpc('crm_finance_summary');
  if (error) throw error;
  return data;
}

async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(clientFromRow);
}

async function getClient(id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return clientFromRow(data);
}

async function createClient(item) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...clientToRow(item), created_at: now, updated_at: now })
    .select()
    .single();
  if (error) throw error;
  return clientFromRow(data);
}

async function updateClient(id, patch) {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...clientToRow(patch), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return clientFromRow(data);
}

async function deleteClient(id) {
  const { data, error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function listProjects(includeCosts) {
  const select = includeCosts
    ? '*, clients(*), project_costs(*)'
    : '*, clients(*)';
  const { data, error } = await supabase
    .from('crm_projects')
    .select(select)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(projectFromRow);
}

async function getProject(id, includeCosts) {
  const select = includeCosts
    ? '*, clients(*), project_costs(*)'
    : '*, clients(*)';
  const { data, error } = await supabase
    .from('crm_projects')
    .select(select)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return projectFromRow(data);
}

async function createProject(item) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('crm_projects')
    .insert({ ...projectToRow(item), created_at: now, updated_at: now })
    .select('*, clients(*)')
    .single();
  if (error) throw error;
  return projectFromRow(data);
}

async function updateProject(id, patch) {
  const { data, error } = await supabase
    .from('crm_projects')
    .update({ ...projectToRow(patch), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, clients(*)')
    .maybeSingle();
  if (error) throw error;
  return projectFromRow(data);
}

async function deleteProject(id) {
  const { data, error } = await supabase
    .from('crm_projects')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function listCosts(projectId) {
  let query = supabase.from('project_costs').select('*').order('incurred_at', { ascending: false });
  if (projectId) query = query.eq('project_id', projectId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(costFromRow);
}

async function createCost(item) {
  const { data, error } = await supabase
    .from('project_costs')
    .insert(costToRow(item))
    .select()
    .single();
  if (error) throw error;
  return costFromRow(data);
}

async function updateCost(id, patch) {
  const { data, error } = await supabase
    .from('project_costs')
    .update(costToRow(patch))
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return costFromRow(data);
}

async function deleteCost(id) {
  const { data, error } = await supabase
    .from('project_costs')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function listSubmissions() {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('received_at', { ascending: false });
  if (error) throw error;
  return data.map(submissionFromRow);
}

async function getSubmission(id) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return submissionFromRow(data);
}

async function updateSubmission(id, patch) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .update(submissionToRow(patch))
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return submissionFromRow(data);
}

async function convertSubmissionToClient(id) {
  const submission = await getSubmission(id);
  if (!submission) return null;

  const client = await createClient({
    name: submission.name,
    email: submission.email,
    status: 'lead',
    source: 'contact_form',
    notes: submission.message,
  });

  const updated = await updateSubmission(id, {
    status: 'converted',
    clientId: client.id,
  });

  return { submission: updated, client };
}

async function getPublicContent() {
  const [{ data, error }, { data: sectionRows, error: secErr }] = await Promise.all([
    supabase.from('public_site_content').select('*').maybeSingle(),
    supabase.from('site_sections').select('slug, enabled'),
  ]);
  if (error) throw error;
  if (secErr) throw secErr;
  if (!data) {
    return { settings: {}, showcaseProjects: [], pricingPlans: [], sections: [] };
  }
  const settings = data.settings || {};
  const vis = settings.visibility || {};
  const sectionVisibility = {};
  (sectionRows || []).forEach((row) => {
    sectionVisibility[row.slug] = row.enabled !== false;
  });
  return {
    settings: {
      ...settings,
      projects: vis.projects || {},
      pricing: vis.pricing || {},
      sectionVisibility,
    },
    showcaseProjects: data.showcase || data.showcase_projects || [],
    pricingPlans: data.pricing || data.pricing_plans || [],
    sections: data.sections || [],
  };
}

function settingsFromRow(data) {
  if (!data) {
    return { hero: {}, stats: {}, strip: {}, footer: {}, contact: {}, visibility: {}, projects: {}, pricing: {} };
  }
  const vis = data.visibility || {};
  return {
    hero: data.hero || {},
    stats: data.stats || {},
    strip: data.strip || {},
    footer: data.footer || {},
    contact: data.contact || {},
    visibility: vis,
    projects: vis.projects || {},
    pricing: vis.pricing || {},
  };
}

async function getSiteSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('hero, stats, strip, footer, contact, visibility, updated_at')
    .eq('id', true)
    .maybeSingle();
  if (error) throw error;
  return {
    settings: settingsFromRow(data),
    updatedAt: data?.updated_at || null,
  };
}

async function updateSiteSettings(settings, userId) {
  const now = new Date().toISOString();
  const visibility = { ...(settings.visibility || {}) };
  if (settings.projects) visibility.projects = settings.projects;
  if (settings.pricing) visibility.pricing = settings.pricing;
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      id: true,
      hero: settings.hero || {},
      stats: settings.stats || {},
      strip: settings.strip || {},
      footer: settings.footer || {},
      contact: settings.contact || {},
      visibility,
      updated_at: now,
      updated_by: userId || null,
    })
    .select('hero, stats, strip, footer, contact, visibility, updated_at')
    .single();
  if (error) throw error;
  return { settings: settingsFromRow(data), updatedAt: data.updated_at };
}

async function listShowcase(all) {
  let query = supabase.from('showcase_projects').select('*').order('sort_order', { ascending: true });
  if (!all) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(showcaseFromRow);
}

async function createShowcase(item, userId) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('showcase_projects')
    .insert({
      ...showcaseToRow(item),
      created_at: now,
      updated_at: now,
      updated_by: userId || null,
    })
    .select()
    .single();
  if (error) throw error;
  return showcaseFromRow(data);
}

async function updateShowcase(id, patch, userId) {
  const { data, error } = await supabase
    .from('showcase_projects')
    .update({
      ...showcaseToRow(patch),
      updated_at: new Date().toISOString(),
      updated_by: userId || null,
    })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return showcaseFromRow(data);
}

async function deleteShowcase(id) {
  const { data, error } = await supabase
    .from('showcase_projects')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function listPricing(all) {
  let query = supabase.from('pricing_plans').select('*').order('sort_order', { ascending: true });
  if (!all) query = query.eq('published', true);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(pricingFromRow);
}

async function createPricing(item, userId) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('pricing_plans')
    .insert({
      ...pricingToRow(item),
      created_at: now,
      updated_at: now,
      updated_by: userId || null,
    })
    .select()
    .single();
  if (error) throw error;
  return pricingFromRow(data);
}

async function updatePricing(id, patch, userId) {
  const { data, error } = await supabase
    .from('pricing_plans')
    .update({
      ...pricingToRow(patch),
      updated_at: new Date().toISOString(),
      updated_by: userId || null,
    })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return pricingFromRow(data);
}

async function deletePricing(id) {
  const { data, error } = await supabase
    .from('pricing_plans')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function listSections(all) {
  let query = supabase.from('site_sections').select('*').order('sort_order', { ascending: true });
  if (!all) query = query.eq('enabled', true);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(sectionFromRow);
}

async function createSection(item, userId) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('site_sections')
    .insert({
      ...sectionToRow(item),
      created_at: now,
      updated_at: now,
      updated_by: userId || null,
    })
    .select()
    .single();
  if (error) throw error;
  return sectionFromRow(data);
}

async function updateSection(id, patch, userId) {
  const { data, error } = await supabase
    .from('site_sections')
    .update({
      ...sectionToRow(patch),
      updated_at: new Date().toISOString(),
      updated_by: userId || null,
    })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return sectionFromRow(data);
}

async function deleteSection(id) {
  const { data, error } = await supabase
    .from('site_sections')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function listTeam() {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('user_id, display_name, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    createdAt: row.created_at,
  }));
}

async function createSignedUploadUrl(filename) {
  const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const path = `${Date.now()}-${safeName}`;
  const { data, error } = await supabase.storage
    .from('site-media')
    .createSignedUploadUrl(path);
  if (error) throw error;
  const { data: publicData } = supabase.storage.from('site-media').getPublicUrl(path);
  return {
    path,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl: publicData.publicUrl,
  };
}

module.exports = {
  getDashboardStats,
  getDashboardPage,
  getFinanceSummary,
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listCosts,
  createCost,
  updateCost,
  deleteCost,
  listSubmissions,
  getSubmission,
  updateSubmission,
  convertSubmissionToClient,
  getPublicContent,
  getSiteSettings,
  updateSiteSettings,
  listShowcase,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  listPricing,
  createPricing,
  updatePricing,
  deletePricing,
  listSections,
  createSection,
  updateSection,
  deleteSection,
  listTeam,
  createSignedUploadUrl,
};
