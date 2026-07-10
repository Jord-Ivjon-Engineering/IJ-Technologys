import { crmApi, fetchProjectDetail } from '../api.js';
import { el, formatDate, formatMoney } from '../state.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { openDrawer } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { renderShell, btn, card, errorBlock } from '../components/shell.js';
import { navigate, refresh } from '../router.js';

export async function renderProjectDetail({ params, path }) {
  const id = params[0];
  let data;
  try {
    data = await fetchProjectDetail(id);
  } catch (err) {
    return renderShell({ title: 'Project', currentPath: path, content: errorBlock(err.message) });
  }

  const p = data.project;
  const costs = data.costs || [];

  const summary = card([
    el('div', { className: 'crm-detail-head' }, [
      el('h2', { text: p.name }),
      StatusBadge(p.status),
    ]),
    el('div', { className: 'crm-finance-row' }, [
      el('div', { className: 'crm-finance-stat' }, [el('span', { text: 'Revenue' }), el('strong', { text: formatMoney(p.revenue) })]),
      el('div', { className: 'crm-finance-stat' }, [el('span', { text: 'Cost' }), el('strong', { text: formatMoney(p.cost) })]),
      el('div', { className: 'crm-finance-stat' }, [el('span', { text: 'Margin' }), el('strong', { text: formatMoney(p.margin) })]),
    ]),
    el('p', { className: 'crm-muted', text: 'Due ' + formatDate(p.dueDate) }),
    el('label', { className: 'crm-check' }, [
      el('input', { type: 'checkbox', checked: p.showcaseFeatured ? 'true' : undefined }),
      el('span', { text: 'Feature on website showcase' }),
    ]),
  ]);

  const featuredCheck = summary.querySelector('input[type=checkbox]');
  featuredCheck.addEventListener('change', async () => {
    try {
      await crmApi.patch('/projects/' + id, { showcaseFeatured: featuredCheck.checked });
      showToast('Showcase setting updated');
    } catch (ex) {
      showToast(ex.message || 'Update failed', 'error');
      featuredCheck.checked = !featuredCheck.checked;
    }
  });

  function openCostForm() {
    const form = el('form', { className: 'crm-form' });
    const label = el('input', { className: 'crm-input', required: 'true' });
    const amount = el('input', { className: 'crm-input', type: 'number', min: '0', step: '1', required: 'true' });
    const date = el('input', { className: 'crm-input', type: 'date' });
    const category = el('select', { className: 'crm-input' });
    ['hosting', 'tools', 'contractor', 'other'].forEach((c) => category.appendChild(el('option', { value: c, text: c })));

    form.appendChild(el('label', { text: 'Label' }));
    form.appendChild(label);
    form.appendChild(el('label', { text: 'Amount (€)' }));
    form.appendChild(amount);
    form.appendChild(el('label', { text: 'Category' }));
    form.appendChild(category);
    form.appendChild(el('label', { text: 'Date' }));
    form.appendChild(date);

    const saveBtn = btn('Add cost', 'primary');
    const drawer = openDrawer({ title: 'Add cost', body: form, footer: [saveBtn] });
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await crmApi.post('/costs', {
          projectId: id,
          label: label.value.trim(),
          amount: Number(amount.value) || 0,
          category: category.value,
          incurredAt: date.value || new Date().toISOString().slice(0, 10),
        });
        showToast('Cost added');
        drawer.close();
        refresh();
      } catch (ex) {
        showToast(ex.message || 'Save failed', 'error');
      }
    });
  }

  const costTable = card([
    el('div', { className: 'crm-card-head' }, [
      el('h3', { text: 'Cost line items' }),
      btn('Add cost', 'ghost', openCostForm),
    ]),
    el('table', { className: 'crm-table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: 'Label' }),
        el('th', { text: 'Amount' }),
        el('th', { text: 'Date' }),
      ])),
      el('tbody', {}, costs.length ? costs.map((c) =>
        el('tr', {}, [
          el('td', { text: c.label }),
          el('td', { text: formatMoney(c.amount) }),
          el('td', { text: formatDate(c.date) }),
        ])
      ) : [el('tr', {}, el('td', { colSpan: '3', className: 'crm-table-empty', text: 'No costs recorded.' }))]),
    ]),
  ]);

  const backBtn = btn('← All projects', 'ghost', () => navigate('/projects'));
  const clientBtn = btn('View client', 'ghost', () => navigate('/clients/' + p.clientId));

  const content = el('div', { className: 'crm-detail' }, [summary, costTable]);
  return renderShell({ title: p.name, currentPath: '/projects', actions: [backBtn, clientBtn], content });
}
