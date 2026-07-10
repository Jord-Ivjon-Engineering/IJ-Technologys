import { crmApi, fetchClients } from '../api.js';
import { el } from '../state.js';
import { DataTable } from '../components/DataTable.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { openDrawer } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { renderShell, btn, errorBlock } from '../components/shell.js';
import { refresh, navigate } from '../router.js';

export async function renderClients({ path }) {
  let clients;
  try {
    clients = await fetchClients();
  } catch (err) {
    return renderShell({ title: 'Clients', currentPath: path, content: errorBlock(err.message) });
  }

  const table = DataTable({
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'company', label: 'Company', sortable: true },
      { key: 'status', label: 'Status', sortable: true, render: (r) => StatusBadge(r.status) },
      { key: 'email', label: 'Email' },
      { key: 'projectCount', label: 'Projects', sortable: true },
    ],
    rows: clients,
    searchPlaceholder: 'Search clients…',
    onRowClick: (row) => navigate('/clients/' + row.id),
    emptyMessage: 'No clients yet. Create your first client.',
  });

  function openForm(client) {
    const form = el('form', { className: 'crm-form' });
    const name = el('input', { className: 'crm-input', value: client?.name || '', required: 'true' });
    const company = el('input', { className: 'crm-input', value: client?.company || '' });
    const email = el('input', { className: 'crm-input', type: 'email', value: client?.email || '', required: 'true' });
    const phone = el('input', { className: 'crm-input', value: client?.phone || '' });
    const status = el('select', { className: 'crm-input' });
    ['lead', 'active', 'past'].forEach((s) => {
      const opt = el('option', { value: s, text: s });
      if (client?.status === s) opt.selected = true;
      status.appendChild(opt);
    });
    const source = el('input', { className: 'crm-input', value: client?.source || '' });
    const notes = el('textarea', { className: 'crm-input', rows: '4' });
    notes.value = client?.notes || '';

    form.appendChild(el('label', { text: 'Name' }));
    form.appendChild(name);
    form.appendChild(el('label', { text: 'Company' }));
    form.appendChild(company);
    form.appendChild(el('label', { text: 'Email' }));
    form.appendChild(email);
    form.appendChild(el('label', { text: 'Phone' }));
    form.appendChild(phone);
    form.appendChild(el('label', { text: 'Status' }));
    form.appendChild(status);
    form.appendChild(el('label', { text: 'Source' }));
    form.appendChild(source);
    form.appendChild(el('label', { text: 'Notes' }));
    form.appendChild(notes);

    const saveBtn = btn(client ? 'Save changes' : 'Create client', 'primary');
    const drawer = openDrawer({
      title: client ? 'Edit client' : 'New client',
      body: form,
      footer: [saveBtn],
    });

    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const payload = {
        name: name.value.trim(),
        company: company.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        status: status.value,
        source: source.value.trim(),
        notes: notes.value.trim(),
      };
      try {
        if (client) await crmApi.patch('/clients/' + client.id, payload);
        else await crmApi.post('/clients', payload);
        showToast(client ? 'Client updated' : 'Client created');
        drawer.close();
        refresh();
      } catch (ex) {
        showToast(ex.message || 'Save failed', 'error');
      }
    });
  }

  const content = el('div', {}, [table]);
  const addBtn = btn('New client', 'primary', () => openForm(null));
  return renderShell({ title: 'Clients', currentPath: path, actions: addBtn, content });
}
