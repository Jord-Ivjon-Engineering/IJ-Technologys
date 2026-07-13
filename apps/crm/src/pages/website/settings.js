import { fetchSiteSettings, saveSiteSettings } from '../../api.js';
import { el } from '../../state.js';
import { BilingualField } from '../../components/BilingualField.js';
import { showToast } from '../../components/Toast.js';
import { renderShell, btn, sectionCard, errorBlock } from '../../components/shell.js';
import { previewBtn } from '../../components/SitePreviewModal.js';

import { footerLinkIcon } from '../../lib/footerLinkUtils.js';

export async function renderWebsiteSettings({ path }) {
  let settings;
  try {
    settings = await fetchSiteSettings();
  } catch (err) {
    return renderShell({ title: 'Website settings', currentPath: path, content: errorBlock(err.message) });
  }

  const footer = settings.footer || {};
  const tagline = BilingualField({ label: 'Footer tagline', name: 'tagline', value: footer.tagline || {}, onChange: () => {} });
  const copyright = BilingualField({ label: 'Copyright line', name: 'copyright', value: footer.copyright || {}, onChange: () => {} });
  const credit = BilingualField({ label: 'Credit line', name: 'credit', value: footer.credit || {}, onChange: () => {} });
  const linksHeading = BilingualField({ label: 'Links column heading', name: 'linksHeading', value: footer.linksHeading || { en: 'Connect', sq: 'Lidhu' }, onChange: () => {} });
  const email = el('input', { className: 'crm-input', type: 'email', value: footer.email || '' });

  // Seed the editable list from stored links, falling back to the legacy
  // Instagram/email fields the first time so existing footer links carry over.
  let initialLinks = Array.isArray(footer.links) ? footer.links : [];
  if (!initialLinks.length) {
    const seeded = [];
    if (footer.instagram) seeded.push({ label: { en: 'Instagram', sq: 'Instagram' }, url: footer.instagram });
    if (footer.email) seeded.push({ label: { en: 'Email', sq: 'Email' }, url: footer.email });
    initialLinks = seeded;
  }

  const linksList = el('div', { className: 'crm-cms-stack' });

  function makeLinkRow(link = {}) {
    const labelField = BilingualField({ label: 'Label', name: 'flabel', value: link.label || {}, onChange: () => {} });
    const iconPreview = el('span', { className: 'crm-foot-icon' });
    const urlInput = el('input', {
      className: 'crm-input',
      type: 'text',
      placeholder: 'https://…   ·   mailto:hello@…   ·   tel:+355…   ·   #contact',
      value: link.url || '',
    });
    const syncIcon = () => { iconPreview.textContent = footerLinkIcon(urlInput.value); };
    urlInput.addEventListener('input', syncIcon);
    syncIcon();

    const removeBtn = btn('Remove', 'danger', () => row.remove());
    const row = el('div', { className: 'crm-card' }, [
      el('div', { className: 'crm-card-head' }, [el('h4', { text: 'Link' }), removeBtn]),
      labelField,
      el('label', { className: 'crm-card-label', text: 'URL — icon is picked automatically' }),
      el('div', { className: 'crm-foot-url-row' }, [iconPreview, urlInput]),
    ]);
    row._getLink = () => ({ label: labelField.getValues(), url: urlInput.value.trim() });
    return row;
  }

  initialLinks.forEach((link) => linksList.appendChild(makeLinkRow(link)));

  const addLinkBtn = btn('Add link', 'ghost', () => linksList.appendChild(makeLinkRow()));

  const collectLinks = () =>
    Array.from(linksList.children)
      .map((row) => row._getLink())
      .filter((link) => link.url);

  const stack = el('div', { className: 'crm-cms-stack' }, [
    sectionCard('Footer copy', [tagline, copyright, credit]),
    sectionCard('Footer links', [
      linksHeading,
      el('label', { className: 'crm-card-label', text: 'Contact email (used across the site)' }),
      email,
      el('label', { className: 'crm-card-label', text: 'Links' }),
      linksList,
      addLinkBtn,
    ]),
  ]);

  const buildFooter = () => ({
    ...footer,
    tagline: tagline.getValues(),
    copyright: copyright.getValues(),
    credit: credit.getValues(),
    linksHeading: linksHeading.getValues(),
    email: email.value.trim(),
    links: collectLinks(),
  });

  const saveBtn = btn('Save', 'primary', async () => {
    try {
      await saveSiteSettings({ ...settings, footer: buildFooter() });
      showToast('Settings saved');
    } catch (ex) {
      showToast(ex.message || 'Save failed', 'error');
    }
  });

  const content = el('div', { className: 'crm-cms' }, [stack]);
  const getPreviewDraft = () => ({ settings: { footer: buildFooter() } });
  return renderShell({ title: 'Website settings', currentPath: path, actions: [previewBtn('Preview site', '', getPreviewDraft), saveBtn], content });
}
