import { crmApi, fetchSubmissions } from '../api.js';
import { el, formatDate } from '../state.js';
import { DataTable } from '../components/DataTable.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { openDrawer } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { renderShell, btn, errorBlock } from '../components/shell.js';
import { navigate } from '../router.js';

export async function renderInbox({ path }) {
  let submissions;
  try {
    submissions = await fetchSubmissions();
  } catch (err) {
    return renderShell({ title: 'Inbox', currentPath: path, content: errorBlock(err.message) });
  }

  let tableRef = null;

  function showDetail(sub) {
    const body = el('div', { className: 'crm-inbox-detail' }, [
      el('p', {}, [el('strong', { text: sub.name }), el('span', { text: ' · ' + sub.email })]),
      el('p', { className: 'crm-muted', text: formatDate(sub.createdAt) }),
      StatusBadge(sub.status),
      sub.package ? el('p', {}, [el('strong', { text: 'Package: ' }), document.createTextNode(sub.package)]) : null,
      el('div', { className: 'crm-inbox-message' }, [el('p', { text: sub.message })]),
    ]);

    const markRead = btn('Mark read', 'ghost', async () => {
      try {
        await crmApi.patch('/submissions/' + sub.id, { status: 'read' });
        showToast('Marked as read');
        drawer.close();
        refreshTable();
      } catch (ex) { showToast(ex.message, 'error'); }
    });
    const markReplied = btn('Mark replied', 'ghost', async () => {
      try {
        await crmApi.patch('/submissions/' + sub.id, { status: 'replied' });
        showToast('Marked as replied');
        drawer.close();
        refreshTable();
      } catch (ex) { showToast(ex.message, 'error'); }
    });
    const convert = btn('Convert to client', 'primary', async () => {
      try {
        const res = await crmApi.post('/submissions/' + sub.id + '/convert');
        showToast('Client created');
        drawer.close();
        if (res.client?.id) navigate('/clients/' + res.client.id);
        else if (res.clientId) navigate('/clients/' + res.clientId);
        else refreshTable();
      } catch (ex) { showToast(ex.message, 'error'); }
    });

    const drawer = openDrawer({
      title: 'Submission',
      body,
      footer: [markRead, markReplied, convert],
    });
  }

  async function refreshTable() {
    try {
      const fresh = await fetchSubmissions();
      if (tableRef) tableRef.setRows(fresh);
    } catch {}
  }

  tableRef = DataTable({
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email' },
      { key: 'package', label: 'Package' },
      { key: 'status', label: 'Status', sortable: true, render: (r) => StatusBadge(r.status) },
      { key: 'createdAt', label: 'Received', sortable: true, render: (r) => el('span', { text: formatDate(r.createdAt) }) },
    ],
    rows: submissions,
    searchPlaceholder: 'Search inbox…',
    onRowClick: showDetail,
    emptyMessage: 'Inbox is empty.',
  });

  const focusId = sessionStorage.getItem('crm-inbox-focus');
  if (focusId) {
    sessionStorage.removeItem('crm-inbox-focus');
    const sub = submissions.find((s) => String(s.id) === String(focusId));
    if (sub) showDetail(sub);
  }

  const content = el('div', {}, [tableRef]);
  return renderShell({ title: 'Inbox', currentPath: path, content });
}
