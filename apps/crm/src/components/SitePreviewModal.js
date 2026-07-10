import { el } from '../state.js';

export const PREVIEW_STORAGE_KEY = 'ij-cms-preview';

let activeOverlay = null;

function actionBtn(label, variant, onClick) {
  const b = el('button', {
    className: 'crm-btn' + (variant ? ' crm-btn-' + variant : ''),
    type: 'button',
    text: label,
  });
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

export function closeSitePreview({ clearStorage = true } = {}) {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
    document.body.classList.remove('crm-modal-open');
    document.removeEventListener('keydown', onPreviewKey);
  }
  if (clearStorage) {
    try {
      sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
    } catch (_) {}
  }
}

function onPreviewKey(e) {
  if (e.key === 'Escape') closeSitePreview();
}

function pushDraftToIframe(iframe, draft) {
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage({ type: 'ij-cms-preview-draft', draft: draft || null }, window.location.origin);
  } catch (_) {}
}

export function openSitePreview({ hash = '', getDraft }) {
  document.body.classList.add('crm-modal-open');

  let draft = null;
  try {
    draft = typeof getDraft === 'function' ? getDraft() : null;
  } catch (_) {
    draft = null;
  }

  closeSitePreview({ clearStorage: false });

  try {
    if (draft) sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch (_) {}

  const hashPart = hash && hash.startsWith('#') ? hash : (hash ? '#' + hash : '');
  const iframeSrc = '/?cms-preview=1' + hashPart;

  const overlay = el('div', { className: 'crm-overlay crm-overlay-preview' });
  const modal = el('div', { className: 'crm-modal crm-modal-preview', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Site preview' });
  const head = el('div', { className: 'crm-modal-head' }, [
    el('div', { className: 'crm-preview-head-text' }, [
      el('h2', { text: 'Preview' }),
      el('p', { className: 'crm-preview-note', text: 'Showing unsaved changes from this page.' }),
    ]),
    el('button', { className: 'crm-modal-close', type: 'button', html: '×', 'aria-label': 'Close' }),
  ]);
  const body = el('div', { className: 'crm-modal-body crm-preview-body' });
  const iframe = el('iframe', {
    className: 'crm-preview-frame',
    title: 'Site preview',
    src: iframeSrc,
  });
  iframe.addEventListener('load', () => pushDraftToIframe(iframe, draft));
  body.appendChild(iframe);

  const foot = el('div', { className: 'crm-modal-foot' }, [
    actionBtn('Close', 'ghost', () => closeSitePreview()),
  ]);

  modal.appendChild(head);
  modal.appendChild(body);
  modal.appendChild(foot);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  activeOverlay = overlay;

  head.querySelector('.crm-modal-close').addEventListener('click', () => closeSitePreview());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSitePreview(); });
  document.addEventListener('keydown', onPreviewKey);
}

export function previewBtn(label, hash, getDraft) {
  return actionBtn(label || 'Preview', 'ghost', () => openSitePreview({ hash, getDraft }));
}
