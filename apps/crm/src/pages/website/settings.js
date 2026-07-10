import { fetchSiteSettings, saveSiteSettings } from '../../api.js';
import { el } from '../../state.js';
import { BilingualField } from '../../components/BilingualField.js';
import { showToast } from '../../components/Toast.js';
import { renderShell, btn, sectionCard, errorBlock } from '../../components/shell.js';
import { previewBtn } from '../../components/SitePreviewModal.js';

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
  const requestCall = BilingualField({ label: 'Request a call label', name: 'requestCall', value: footer.requestCall || {}, onChange: () => {} });
  const email = el('input', { className: 'crm-input', type: 'email', value: footer.email || '' });
  const instagram = el('input', { className: 'crm-input', value: footer.instagram || '' });

  const stack = el('div', { className: 'crm-cms-stack' }, [
    sectionCard('Footer copy', [tagline, copyright, credit, requestCall]),
    sectionCard('Footer links', [
      el('label', { text: 'Contact email' }),
      email,
      el('label', { text: 'Instagram URL' }),
      instagram,
    ]),
  ]);

  const saveBtn = btn('Save', 'primary', async () => {
    try {
      await saveSiteSettings({
        ...settings,
        footer: {
          ...footer,
          tagline: tagline.getValues(),
          copyright: copyright.getValues(),
          credit: credit.getValues(),
          requestCall: requestCall.getValues(),
          email: email.value.trim(),
          instagram: instagram.value.trim(),
        },
      });
      showToast('Settings saved');
    } catch (ex) {
      showToast(ex.message || 'Save failed', 'error');
    }
  });

  const content = el('div', { className: 'crm-cms' }, [stack]);
  const getPreviewDraft = () => ({
    settings: {
      footer: {
        tagline: tagline.getValues(),
        copyright: copyright.getValues(),
        credit: credit.getValues(),
        requestCall: requestCall.getValues(),
        email: email.value.trim(),
        instagram: instagram.value.trim(),
      },
    },
  });
  return renderShell({ title: 'Website settings', currentPath: path, actions: [previewBtn('Preview site', '', getPreviewDraft), saveBtn], content });
}
