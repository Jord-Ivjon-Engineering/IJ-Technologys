import { el } from '../state.js';

let root = null;
const queue = [];

export function initToast() {
  root = document.createElement('div');
  root.className = 'crm-toast-root';
  root.setAttribute('aria-live', 'polite');
  document.body.appendChild(root);
  const pending = queue.splice(0);
  pending.forEach(({ message, type }) => showToast(message, type));
}

export function showToast(message, type = 'success') {
  if (!root) {
    queue.push({ message, type });
    return;
  }
  const item = el('div', { className: 'crm-toast crm-toast-' + type, text: message });
  root.appendChild(item);
  requestAnimationFrame(() => item.classList.add('visible'));
  setTimeout(() => {
    item.classList.remove('visible');
    setTimeout(() => item.remove(), 300);
  }, 3200);
}
