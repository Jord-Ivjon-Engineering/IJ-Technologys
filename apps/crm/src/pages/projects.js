import { crmApi, fetchClients, fetchProjects } from '../api.js';
import { el, formatDate, formatMoney } from '../state.js';
import { DataTable } from '../components/DataTable.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { openDrawer } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { renderShell, btn, errorBlock } from '../components/shell.js';
import { navigate, refresh } from '../router.js';

export async function renderProjects({ path }) {
  let projects;
  let clients = [];
  try {
    [projects, clients] = await Promise.all([fetchProjects(), fetchClients()]);
  } catch (err) {
    return renderShell({ title: 'Projects', currentPath: path, content: errorBlock(err.message) });
  }

  const clientParam = new URLSearchParams(location.hash.split('?')[1] || '').get('client');

  const table = DataTable({
    columns: [
      { key: 'name', label: 'Project', sortable: true },
      { key: 'clientName', label: 'Client', sortable: true },
      { key: 'status', label: 'Status', sortable: true, render: (r) => StatusBadge(r.status) },
      { key: 'revenue', label: 'Revenue', sortable: true, render: (r) => el('span', { text: formatMoney(r.revenue) }) },
      { key: 'cost', label: 'Cost', sortable: true, render: (r) => el('span', { text: formatMoney(r.cost) }) },
      { key: 'margin', label: 'Margin', sortable: true, render: (r) => el('span', { text: formatMoney(r.margin) }) },
      { key: 'dueDate', label: 'Due', sortable: true, render: (r) => el('span', { text: formatDate(r.dueDate) }) },
    ],
    rows: projects,
    searchPlaceholder: 'Search projects…',
    onRowClick: (row) => navigate('/projects/' + row.id),
    emptyMessage: 'No projects yet.',
  });

  function openForm() {
    const form = el('form', { className: 'crm-form' });
    const name = el('input', { className: 'crm-input', required: 'true' });
    const clientSelect = el('select', { className: 'crm-input' });
    clients.forEach((c) => {
      const opt = el('option', { value: c.id, text: c.name + (c.company ? ' · ' + c.company : '') });
      if (clientParam === c.id) opt.selected = true;
      clientSelect.appendChild(opt);
    });
    const status = el('select', { className: 'crm-input' });
    ['inquiry', 'scoping', 'active', 'review', 'done', 'maintenance'].forEach((s) => {
      status.appendChild(el('option', { value: s, text: s }));
    });
    const revenue = el('input', { className: 'crm-input', type: 'number', min: '0', step: '1' });
    const dueDate = el('input', { className: 'crm-input', type: 'date' });

    form.appendChild(el('label', { text: 'Project name' }));
    form.appendChild(name);
    form.appendChild(el('label', { text: 'Client' }));
    form.appendChild(clientSelect);
    form.appendChild(el('label', { text: 'Status' }));
    form.appendChild(status);
    form.appendChild(el('label', { text: 'Agreed revenue (€)' }));
    form.appendChild(revenue);
    form.appendChild(el('label', { text: 'Due date' }));
    form.appendChild(dueDate);

    const saveBtn = btn('Create project', 'primary');
    const drawer = openDrawer({ title: 'New project', body: form, footer: [saveBtn] });

    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await crmApi.post('/projects', {
          name: name.value.trim(),
          clientId: clientSelect.value,
          status: status.value,
          agreedRevenue: Number(revenue.value) || 0,
          dueDate: dueDate.value || null,
        });
        showToast('Project created');
        drawer.close();
        refresh();
      } catch (ex) {
        showToast(ex.message || 'Save failed', 'error');
      }
    });
  }

  if (clientParam) setTimeout(openForm, 0);

  const content = el('div', {}, [table]);
  const addBtn = btn('New project', 'primary', openForm);
  return renderShell({ title: 'Projects', currentPath: path, actions: addBtn, content });
}
