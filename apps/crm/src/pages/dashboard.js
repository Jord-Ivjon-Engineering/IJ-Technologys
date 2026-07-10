import { fetchDashboard } from '../api.js';
import { el, formatDate, formatMoney } from '../state.js';
import { KpiCard } from '../components/KpiCard.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { renderShell, card, grid, errorBlock, btn } from '../components/shell.js';
import { navigate } from '../router.js';

function dashboardSkeleton() {
  const sk = (w) => el('div', { className: 'crm-skeleton crm-skeleton-' + w });
  const triage = el('section', { className: 'crm-dashboard-section' }, [
    el('h2', { className: 'crm-dashboard-section-title', text: 'Needs attention' }),
    el('div', { className: 'crm-grid crm-grid-3 crm-dashboard-triage' }, [
      sk('kpi'), sk('kpi'), sk('kpi'),
    ]),
  ]);
  const finance = el('section', { className: 'crm-dashboard-section' }, [
    el('h2', { className: 'crm-dashboard-section-title', text: 'Finance' }),
    el('div', { className: 'crm-grid crm-grid-3 crm-dashboard-finance' }, [
      sk('kpi'), sk('kpi'), sk('kpi'),
    ]),
  ]);
  const panels = el('div', { className: 'crm-dashboard-panels' }, [
    card([el('h3', { text: 'Recent submissions' }), sk('block'), sk('block')]),
    card([el('h3', { text: 'Projects due soon' }), sk('block'), sk('block')]),
    card([el('h3', { text: 'Quick links' }), sk('block')]),
    card([el('h3', { text: 'Recent activity' }), sk('block'), sk('block')]),
  ]);
  return el('div', { className: 'crm-dashboard crm-dashboard-loading' }, [triage, finance, panels]);
}

function listRow({ main, meta, badge, onClick }) {
  const row = el('button', { className: 'crm-list-item crm-list-item-action', type: 'button' }, [
    el('div', { className: 'crm-list-main' }, main),
    badge || null,
    meta ? el('span', { className: 'crm-list-meta', text: meta }) : null,
  ]);
  if (onClick) row.addEventListener('click', onClick);
  return row;
}

function buildActivityFeed(submissions, projects) {
  const items = [];
  (submissions || []).forEach((s) => {
    items.push({
      sort: new Date(s.createdAt).getTime(),
      label: 'New submission from ' + s.name,
      meta: formatDate(s.createdAt),
      onClick: () => {
        sessionStorage.setItem('crm-inbox-focus', s.id);
        navigate('/inbox');
      },
    });
  });
  (projects || []).forEach((p) => {
    items.push({
      sort: new Date(p.dueDate).getTime(),
      label: p.name + ' due soon',
      meta: formatDate(p.dueDate),
      onClick: () => navigate('/projects/' + p.id),
    });
  });
  items.sort((a, b) => b.sort - a.sort);
  const recent = items.slice(0, 6);
  if (!recent.length) {
    return el('p', { className: 'crm-muted', text: 'No recent activity yet.' });
  }
  return el('div', { className: 'crm-list' }, recent.map((item) =>
    listRow({
      main: [el('strong', { text: item.label })],
      meta: item.meta,
      onClick: item.onClick,
    })
  ));
}

function buildDashboardContent(data) {
  const k = data.kpis || {};
  const newInbox = k.newInbox ?? 0;
  const dueSoon = k.dueSoonCount ?? (data.projectsDueSoon || []).length;

  const triage = el('section', { className: 'crm-dashboard-section' }, [
    el('h2', { className: 'crm-dashboard-section-title', text: 'Needs attention' }),
    grid([
      KpiCard({
        label: 'New in inbox',
        value: String(newInbox),
        sub: 'Awaiting first reply',
        variant: newInbox > 0 ? 'urgent' : '',
        onClick: () => navigate('/inbox'),
      }),
      KpiCard({
        label: 'Due soon',
        value: String(dueSoon),
        sub: 'Next 14 days',
        variant: dueSoon > 0 ? 'urgent' : '',
        onClick: () => navigate('/projects'),
      }),
      KpiCard({
        label: 'Pending reviews',
        value: String(k.pendingReviews ?? 0),
        sub: 'Awaiting approval',
        onClick: () => navigate('/reviews'),
      }),
    ], 3),
  ]);

  const finance = el('section', { className: 'crm-dashboard-section' }, [
    el('h2', { className: 'crm-dashboard-section-title', text: 'Finance' }),
    grid([
      KpiCard({
        label: 'Total revenue',
        value: formatMoney(k.totalRevenue),
        sub: 'All projects',
        variant: 'finance',
        onClick: () => navigate('/finance'),
      }),
      KpiCard({
        label: 'Total costs',
        value: formatMoney(k.totalCost),
        sub: 'All projects',
        variant: 'finance',
        onClick: () => navigate('/finance'),
      }),
      KpiCard({
        label: 'Net margin',
        value: formatMoney(k.margin),
        sub: 'All projects',
        variant: 'finance',
        onClick: () => navigate('/finance'),
      }),
    ], 3),
  ]);

  const recent = card([
    el('h3', { text: 'Recent submissions' }),
    (data.recentSubmissions || []).length
      ? el('div', { className: 'crm-list' }, (data.recentSubmissions || []).map((s) =>
          listRow({
            main: [
              el('strong', { text: s.name }),
              el('span', { text: s.email }),
            ],
            badge: StatusBadge(s.status),
            meta: formatDate(s.createdAt),
            onClick: () => {
              sessionStorage.setItem('crm-inbox-focus', s.id);
              navigate('/inbox');
            },
          })
        ))
      : el('p', { className: 'crm-muted', text: 'No recent submissions.' }),
  ]);

  const due = card([
    el('h3', { text: 'Projects due soon' }),
    (data.projectsDueSoon || []).length
      ? el('div', { className: 'crm-list' }, (data.projectsDueSoon || []).map((p) =>
          listRow({
            main: [
              el('strong', { text: p.name }),
              el('span', { text: p.clientName }),
            ],
            meta: formatDate(p.dueDate),
            onClick: () => navigate('/projects/' + p.id),
          })
        ))
      : el('p', { className: 'crm-muted', text: 'No upcoming deadlines.' }),
  ]);

  const quick = card([
    el('h3', { text: 'Quick links' }),
    el('div', { className: 'crm-quick-links' }, [
      btn('Edit homepage', 'ghost', () => navigate('/website/hero')),
      btn('View inbox', 'ghost', () => navigate('/inbox')),
      btn('Finance overview', 'ghost', () => navigate('/finance')),
      btn('All clients (' + (k.totalClients ?? 0) + ')', 'ghost', () => navigate('/clients')),
    ]),
  ]);

  const activity = card([
    el('h3', { text: 'Recent activity' }),
    buildActivityFeed(data.recentSubmissions, data.projectsDueSoon),
  ]);

  return el('div', { className: 'crm-dashboard' }, [
    triage,
    finance,
    el('div', { className: 'crm-dashboard-panels' }, [recent, due, quick, activity]),
  ]);
}

export async function renderDashboard({ path }) {
  renderShell({ title: 'Dashboard', currentPath: path, content: dashboardSkeleton() });

  let data;
  try {
    data = await fetchDashboard();
  } catch (err) {
    return renderShell({ title: 'Dashboard', currentPath: path, content: errorBlock(err.message) });
  }

  return renderShell({
    title: 'Dashboard',
    currentPath: path,
    content: buildDashboardContent(data),
  });
}
