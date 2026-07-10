import { crmApi, fetchReviews } from '../api.js';
import { el, esc, formatDate } from '../state.js';
import { showToast } from '../components/Toast.js';
import { renderShell, btn, card, errorBlock } from '../components/shell.js';

function stars(n) {
  n = Math.max(1, Math.min(5, +n || 5));
  const wrap = el('span', { className: 'crm-stars' });
  wrap.innerHTML = '★'.repeat(n) + '<span class="off">' + '☆'.repeat(5 - n) + '</span>';
  return wrap;
}

export async function renderReviews({ path }) {
  let tab = 'pending';
  const wrap = el('div', { className: 'crm-reviews' });
  const tabs = el('div', { className: 'crm-tabs' });
  const list = el('div', { className: 'crm-review-list' });

  ['pending', 'published', 'all'].forEach((t) => {
    const b = btn(t.charAt(0).toUpperCase() + t.slice(1), tab === t ? 'primary' : 'ghost', () => {
      tab = t;
      load();
    });
    b.dataset.tab = t;
    tabs.appendChild(b);
  });

  wrap.appendChild(tabs);
  wrap.appendChild(list);

  async function load() {
    tabs.querySelectorAll('.crm-btn').forEach((b) => {
      b.className = 'crm-btn crm-btn-' + (b.dataset.tab === tab ? 'primary' : 'ghost');
    });
    list.innerHTML = '';
    list.appendChild(el('p', { className: 'crm-muted', text: 'Loading…' }));

    try {
      const reviews = await fetchReviews(tab);
      list.innerHTML = '';
      if (!reviews.length) {
        list.appendChild(el('p', { className: 'crm-muted', text: 'No reviews in this tab.' }));
        return;
      }

      reviews.forEach((r) => {
        const item = card([
          stars(r.rating),
          el('p', { text: r.text }),
          el('p', { className: 'crm-muted', html: '<strong>' + esc(r.name) + '</strong>' + (r.role ? ' · ' + esc(r.role) : '') + ' · ' + formatDate(r.createdAt) }),
          el('div', { className: 'crm-review-actions' }, [
            !r.approved ? btn('Approve', 'primary', () => act(r.id, 'approve', item)) : null,
            btn('Reject', 'danger', () => act(r.id, 'reject', item)),
          ].filter(Boolean)),
        ]);
        list.appendChild(item);
      });
    } catch (err) {
      list.innerHTML = '';
      list.appendChild(errorBlock(err.message));
    }
  }

  async function act(id, kind, cardEl) {
    try {
      if (kind === 'approve') await crmApi.post('/reviews/' + id + '/approve');
      else await crmApi.delete('/reviews/' + id);
      showToast(kind === 'approve' ? 'Review approved' : 'Review rejected');
      cardEl.remove();
    } catch (ex) {
      showToast(ex.message || 'Action failed', 'error');
    }
  }

  await load();
  return renderShell({ title: 'Reviews', currentPath: path, content: wrap });
}
