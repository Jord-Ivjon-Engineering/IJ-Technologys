import { el } from '../state.js';

let activeOverlay = null;

function closeActive() {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
    document.body.classList.remove('crm-modal-open');
  }
}

export function openDrawer({ title, body, footer }) {
  closeActive();
  const overlay = el('div', { className: 'crm-overlay crm-overlay-drawer' });
  const panel = el('div', { className: 'crm-drawer' });
  const head = el('div', { className: 'crm-drawer-head' }, [
    el('h2', { text: title }),
    el('button', { className: 'crm-modal-close', type: 'button', html: '×', 'aria-label': 'Close' }),
  ]);
  const content = el('div', { className: 'crm-drawer-body' });
  if (typeof body === 'string') content.textContent = body;
  else if (body) content.appendChild(body);
  panel.appendChild(head);
  panel.appendChild(content);
  if (footer) {
    const foot = el('div', { className: 'crm-drawer-foot' });
    if (Array.isArray(footer)) footer.forEach((n) => foot.appendChild(n));
    else foot.appendChild(footer);
    panel.appendChild(foot);
  }
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  document.body.classList.add('crm-modal-open');
  activeOverlay = overlay;

  head.querySelector('.crm-modal-close').addEventListener('click', closeActive);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeActive(); });

  return { close: closeActive, content };
}
