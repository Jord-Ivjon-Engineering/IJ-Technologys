import { fetchFinance } from '../api.js';
import { el, formatMoney } from '../state.js';
import { KpiCard } from '../components/KpiCard.js';
import { renderShell, card, grid, errorBlock } from '../components/shell.js';

export async function renderFinance({ path }) {
  let data;
  try {
    data = await fetchFinance();
  } catch (err) {
    return renderShell({ title: 'Finance', currentPath: path, content: errorBlock(err.message) });
  }

  const s = data.summary || {};
  const kpis = grid([
    KpiCard({ label: 'Revenue YTD', value: formatMoney(s.revenueYtd) }),
    KpiCard({ label: 'Costs YTD', value: formatMoney(s.costsYtd) }),
    KpiCard({ label: 'Margin YTD', value: formatMoney(s.marginYtd) }),
    KpiCard({ label: 'Revenue this month', value: formatMoney(s.revenueMonth) }),
    KpiCard({ label: 'Costs this month', value: formatMoney(s.costsMonth) }),
    KpiCard({ label: 'Margin this month', value: formatMoney(s.marginMonth) }),
  ], 3);

  const monthly = data.monthly || [];
  const maxVal = Math.max(...monthly.map((m) => Math.max(m.revenue || 0, m.cost || 0)), 1);

  const chart = card([
    el('h3', { text: 'Revenue vs cost by month' }),
    monthly.length
      ? el('div', { className: 'crm-bar-chart' }, monthly.map((m) => {
          const revH = Math.round(((m.revenue || 0) / maxVal) * 100);
          const costH = Math.round(((m.cost || 0) / maxVal) * 100);
          return el('div', { className: 'crm-bar-group' }, [
            el('div', { className: 'crm-bars' }, [
              el('div', { className: 'crm-bar crm-bar-rev', style: 'height:' + revH + '%', title: formatMoney(m.revenue) }),
              el('div', { className: 'crm-bar crm-bar-cost', style: 'height:' + costH + '%', title: formatMoney(m.cost) }),
            ]),
            el('span', { className: 'crm-bar-label', text: (m.month || '').slice(5) }),
          ]);
        }))
      : el('p', { className: 'crm-muted', text: 'No monthly data yet.' }),
    el('div', { className: 'crm-chart-legend' }, [
      el('span', { className: 'crm-legend-rev', text: 'Revenue' }),
      el('span', { className: 'crm-legend-cost', text: 'Cost' }),
    ]),
  ]);

  const top = card([
    el('h3', { text: 'Top projects by margin' }),
    (data.topProjects || []).length
      ? el('table', { className: 'crm-table' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'Project' }), el('th', { text: 'Margin' })])),
          el('tbody', {}, (data.topProjects || []).map((p) =>
            el('tr', {}, [el('td', { text: p.name }), el('td', { text: formatMoney(p.margin) })])
          )),
        ])
      : el('p', { className: 'crm-muted', text: 'No project margins recorded yet.' }),
  ]);

  const content = el('div', { className: 'crm-finance' }, [kpis, chart, top]);
  return renderShell({ title: 'Finance', currentPath: path, content });
}
