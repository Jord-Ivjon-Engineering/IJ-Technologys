import { el } from '../state.js';
import { signOut } from '../auth.js';
import { navigate } from '../router.js';

const NAV = [
  { group: 'Overview', items: [{ path: '/dashboard', label: 'Dashboard', icon: '▣' }] },
  { group: 'Work', items: [
    { path: '/clients', label: 'Clients', icon: '◎' },
    { path: '/projects', label: 'Projects', icon: '◈' },
    { path: '/inbox', label: 'Inbox', icon: '✉' },
  ]},
  { group: 'Website', items: [
    { path: '/website/settings', label: 'Settings', icon: '⚙' },
    { path: '/website/hero', label: 'Hero & stats', icon: '★' },
    { path: '/website/showcase', label: 'Showcase', icon: '◇' },
    { path: '/website/pricing', label: 'Pricing', icon: '€' },
    { path: '/website/sections', label: 'Sections', icon: '≡' },
  ]},
  { group: 'Insights', items: [
    { path: '/finance', label: 'Finance', icon: '↗' },
    { path: '/reviews', label: 'Reviews', icon: '☆' },
  ]},
];

let shell = null;

function isActive(currentPath, itemPath) {
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
}

function buildShell() {
  const root = el('div', { className: 'crm-app' });
  const sidebar = el('aside', { className: 'crm-sidebar' });
  const navLinks = [];

  sidebar.appendChild(el('div', { className: 'crm-brand' }, [
    el('img', { src: '/images/logo.png', alt: 'IJ Technologys' }),
    el('span', { text: 'CRM' }),
  ]));

  NAV.forEach((section) => {
    const group = el('div', { className: 'crm-nav-group' });
    group.appendChild(el('span', { className: 'crm-nav-label', text: section.group }));
    const list = el('ul', { className: 'crm-nav-list' });
    section.items.forEach((item) => {
      const li = el('li');
      const a = el('a', {
        href: '#' + item.path,
        html: '<span class="crm-nav-icon">' + item.icon + '</span>' + item.label,
      });
      a.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(item.path);
      });
      navLinks.push({ el: a, path: item.path });
      li.appendChild(a);
      list.appendChild(li);
    });
    group.appendChild(list);
    sidebar.appendChild(group);
  });

  const account = el('div', { className: 'crm-nav-account' });
  const logoutBtn = el('button', { className: 'crm-nav-logout', type: 'button', text: 'Log out' });
  logoutBtn.addEventListener('click', () => signOut());
  account.appendChild(logoutBtn);
  sidebar.appendChild(account);

  const main = el('div', { className: 'crm-main' });
  const topbar = el('header', { className: 'crm-topbar' });
  const burger = el('button', { className: 'crm-burger', type: 'button', 'aria-label': 'Menu', 'aria-expanded': 'false', html: '☰' });
  burger.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  topbar.appendChild(burger);

  const topLeft = el('div', { className: 'crm-topbar-left' });
  const titleEl = el('h1');
  topLeft.appendChild(titleEl);
  topbar.appendChild(topLeft);

  const topRight = el('div', { className: 'crm-topbar-actions' });
  topbar.appendChild(topRight);

  const pageEl = el('main', { className: 'crm-page' });
  main.appendChild(topbar);
  main.appendChild(pageEl);
  root.appendChild(sidebar);
  root.appendChild(main);

  return { root, titleEl, pageEl, topRight, navLinks, sidebar };
}

function updateShell({ title, actions, content, currentPath }) {
  shell.titleEl.textContent = title || '';
  shell.pageEl.innerHTML = '';
  if (content) shell.pageEl.appendChild(content);

  shell.topRight.innerHTML = '';
  if (actions) {
    if (Array.isArray(actions)) actions.forEach((a) => shell.topRight.appendChild(a));
    else shell.topRight.appendChild(actions);
  }

  shell.navLinks.forEach(({ el: link, path }) => {
    link.className = isActive(currentPath, path) ? 'active' : '';
  });
}

export function renderShell({ title, actions, content, currentPath }) {
  if (!shell) shell = buildShell();
  updateShell({ title, actions, content, currentPath });
  return shell.root;
}

export function destroyShell() {
  shell = null;
}

export function btn(label, variant, onClick) {
  const b = el('button', {
    className: 'crm-btn' + (variant ? ' crm-btn-' + variant : ''),
    type: 'button',
    text: label,
  });
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

export function toggleBtn(label, { checked, dataField, offLabel, onLabel } = {}) {
  const input = el('input', { type: 'checkbox', checked: checked ? 'true' : undefined });
  if (dataField) input.setAttribute('data-field', dataField);
  const onText = onLabel || label;
  const offText = offLabel;
  const dual = Boolean(offText);
  const span = el('span', { text: dual ? (checked ? onText : offText) : label });
  if (dual) {
    input.addEventListener('change', () => {
      span.textContent = input.checked ? onText : offText;
    });
  }
  return el('label', { className: 'crm-toggle-btn' }, [
    input,
    span,
  ]);
}

export function cardFooter(children) {
  const footer = el('div', { className: 'crm-card-footer' });
  children.forEach((child) => { if (child) footer.appendChild(child); });
  return footer;
}

export function linkBtn(label, href) {
  const a = el('a', { className: 'crm-btn crm-btn-ghost', href, target: '_blank', rel: 'noopener', text: label });
  return a;
}

export function errorBlock(message) {
  return el('div', { className: 'crm-error', text: message || 'Something went wrong.' });
}

export function card(children, className) {
  return el('div', { className: 'crm-card' + (className ? ' ' + className : '') }, children);
}

export function sectionCard(title, children) {
  const items = [];
  if (title) {
    items.push(el('div', { className: 'crm-card-head' }, [el('h4', { text: title })]));
  }
  if (children) {
    (Array.isArray(children) ? children : [children]).forEach((c) => { if (c) items.push(c); });
  }
  return card(items);
}

export function grid(children, cols) {
  const g = el('div', { className: 'crm-grid crm-grid-' + (cols || 3) });
  children.forEach((c) => { if (c) g.appendChild(c); });
  return g;
}
