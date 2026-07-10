import { fetchClientDetail } from '../api.js';
import { el, formatDate, formatMoney } from '../state.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { renderShell, btn, card, errorBlock } from '../components/shell.js';
import { navigate } from '../router.js';

export async function renderClientDetail({ params, path }) {
  const id = params[0];
  let data;
  try {
    data = await fetchClientDetail(id);
  } catch (err) {
    return renderShell({ title: 'Client', currentPath: path, content: errorBlock(err.message) });
  }

  const c = data.client;
  const projects = data.projects || [];

  const info = card([
    el('div', { className: 'crm-detail-head' }, [
      el('h2', { text: c.name }),
      StatusBadge(c.status),
    ]),
    el('dl', { className: 'crm-dl' }, [
      el('dt', { text: 'Company' }), el('dd', { text: c.company || '—' }),
      el('dt', { text: 'Email' }), el('dd', { text: c.email || '—' }),
      el('dt', { text: 'Phone' }), el('dd', { text: c.phone || '—' }),
      el('dt', { text: 'Source' }), el('dd', { text: c.source || '—' }),
      el('dt', { text: 'Since' }), el('dd', { text: formatDate(c.createdAt) }),
    ]),
    el('div', { className: 'crm-notes' }, [
      el('h4', { text: 'Notes' }),
      el('p', { text: c.notes || 'No notes yet.' }),
    ]),
  ]);

  const projList = card([
    el('h3', { text: 'Projects' }),
    projects.length
      ? el('div', { className: 'crm-list' }, projects.map((p) =>
          el('div', { className: 'crm-list-item clickable', onClick: () => navigate('/projects/' + p.id) }, [
            el('strong', { text: p.name }),
            StatusBadge(p.status),
            el('span', { text: formatMoney(p.margin) + ' margin' }),
            el('span', { className: 'crm-list-meta', text: formatDate(p.dueDate) }),
          ])
        ))
      : el('p', { className: 'crm-muted', text: 'No projects linked yet.' }),
  ]);

  const backBtn = btn('← All clients', 'ghost', () => navigate('/clients'));
  const projectBtn = btn('Create project', 'primary', () => navigate('/projects?client=' + id));

  const content = el('div', { className: 'crm-detail' }, [info, projList]);
  return renderShell({ title: c.name, currentPath: '/clients', actions: [backBtn, projectBtn], content });
}
