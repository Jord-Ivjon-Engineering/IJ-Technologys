import { el } from '../state.js';
import { uploadSiteImage } from '../api.js';
import { showToast } from './Toast.js';
import { btn } from './shell.js';

function closeDropdown(menu, trigger) {
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
}

function openDropdown(menu, trigger) {
  menu.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
}

export function ImageUploadField({ label, value, onChange }) {
  const wrap = el('div', { className: 'crm-image-field' });
  if (label) wrap.appendChild(el('label', { text: label }));

  const previewWrap = el('div', { className: 'crm-image-preview-wrap' });
  const preview = el('img', { className: 'crm-image-preview', alt: '' });
  previewWrap.appendChild(preview);

  const urlInput = el('input', {
    className: 'crm-input',
    type: 'url',
    value: value || '',
    placeholder: 'https://… or upload below',
  });

  const fileInput = el('input', {
    type: 'file',
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    className: 'crm-image-file-input',
  });

  const dropdown = el('div', { className: 'crm-dropdown' });
  const trigger = btn('More options', 'ghost', (e) => {
    e.stopPropagation();
    if (trigger.disabled) return;
    if (menu.hidden) {
      openDropdown(menu, trigger);
      setTimeout(() => document.addEventListener('click', onDocClick), 0);
    } else {
      closeDropdown(menu, trigger);
      document.removeEventListener('click', onDocClick);
    }
  });
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');

  const menu = el('div', { className: 'crm-dropdown-menu', role: 'menu', hidden: true });
  const chooseItem = el('button', { className: 'crm-dropdown-item', type: 'button', role: 'menuitem', text: 'Choose image' });
  const clearItem = el('button', { className: 'crm-dropdown-item', type: 'button', role: 'menuitem', text: 'Clear' });
  menu.appendChild(chooseItem);
  menu.appendChild(clearItem);
  dropdown.appendChild(trigger);
  dropdown.appendChild(menu);

  const actions = el('div', { className: 'crm-image-actions' }, [dropdown]);

  function onDocClick(e) {
    if (!dropdown.contains(e.target)) {
      closeDropdown(menu, trigger);
      document.removeEventListener('click', onDocClick);
    }
  }

  chooseItem.addEventListener('click', () => {
    closeDropdown(menu, trigger);
    document.removeEventListener('click', onDocClick);
    fileInput.click();
  });

  clearItem.addEventListener('click', () => {
    closeDropdown(menu, trigger);
    document.removeEventListener('click', onDocClick);
    urlInput.value = '';
    updatePreview('');
    if (onChange) onChange('');
  });

  function updatePreview(url) {
    if (url) {
      preview.src = url;
      preview.hidden = false;
      previewWrap.hidden = false;
    } else {
      preview.removeAttribute('src');
      preview.hidden = true;
      previewWrap.hidden = true;
    }
  }

  urlInput.addEventListener('input', () => {
    const url = urlInput.value.trim();
    updatePreview(url);
    if (onChange) onChange(url);
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    trigger.disabled = true;
    chooseItem.disabled = true;
    trigger.textContent = 'Uploading…';
    try {
      const publicUrl = await uploadSiteImage(file);
      urlInput.value = publicUrl;
      updatePreview(publicUrl);
      if (onChange) onChange(publicUrl);
      showToast('Image uploaded');
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      trigger.disabled = false;
      chooseItem.disabled = false;
      trigger.textContent = 'More options';
    }
  });

  updatePreview(value || '');

  wrap.appendChild(previewWrap);
  wrap.appendChild(urlInput);
  wrap.appendChild(fileInput);
  wrap.appendChild(actions);

  wrap.getValue = () => urlInput.value.trim();
  wrap.setValue = (url) => {
    urlInput.value = url || '';
    updatePreview(urlInput.value.trim());
  };

  return wrap;
}
