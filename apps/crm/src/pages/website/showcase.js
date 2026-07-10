import { crmApi, fetchShowcase } from '../../api.js';
import { el } from '../../state.js';
import { BilingualField } from '../../components/BilingualField.js';
import { ImageUploadField } from '../../components/ImageUploadField.js';
import { showToast } from '../../components/Toast.js';
import { renderShell, btn, card, cardFooter, toggleBtn, errorBlock } from '../../components/shell.js';
import { previewBtn } from '../../components/SitePreviewModal.js';
import { refresh } from '../../router.js';

function showcaseLabel(value) {
  if (!value) return 'Untitled';
  if (typeof value === 'object') return value.en || value.sq || 'Untitled';
  return String(value);
}

export async function renderWebsiteShowcase({ path }) {
  let items;
  try {
    items = await fetchShowcase();
  } catch (err) {
    return renderShell({ title: 'Showcase', currentPath: path, content: errorBlock(err.message) });
  }

  const list = el('div', { className: 'crm-cms-stack' });

  items.forEach((item) => {
    let imageField;

    const cardEl = card([
      el('div', { className: 'crm-card-head' }, [
        el('h4', { text: showcaseLabel(item.title) }),
        btn('Remove', 'danger', async () => {
          try {
            await crmApi.delete('/content/showcase/' + item.id);
            showToast('Item removed');
            refresh();
          } catch (ex) {
            showToast(ex.message || 'Remove failed', 'error');
          }
        }),
      ]),
      el('div', { 'data-field': 'title' }),
      el('div', { 'data-field': 'tag' }),
      el('div', { 'data-field': 'description' }),
      el('div', { 'data-field': 'imageUrl' }),
      el('label', { className: 'crm-card-label', text: 'Sort order' }),
      el('input', { className: 'crm-input', type: 'number', value: String(item.sortOrder ?? 0), 'data-field': 'sortOrder' }),
      cardFooter([
        toggleBtn('Published', { checked: item.published, dataField: 'published', offLabel: 'Draft' }),
        btn('Save item', 'primary', async () => {
          const titleField = cardEl.querySelector('[data-field=title]');
          const tagField = cardEl.querySelector('[data-field=tag]');
          const descField = cardEl.querySelector('[data-field=description]');
          try {
            await crmApi.patch('/content/showcase/' + item.id, {
              title: titleField._bilingual.getValues(),
              tag: tagField._bilingual.getValues(),
              description: descField._bilingual.getValues(),
              imageUrl: imageField.getValue(),
              sortOrder: Number(cardEl.querySelector('[data-field=sortOrder]').value) || 0,
              published: cardEl.querySelector('[data-field=published]').checked,
            });
            showToast('Item saved');
          } catch (ex) {
            showToast(ex.message || 'Save failed', 'error');
          }
        }),
      ]),
    ]);

    const titleWrap = cardEl.querySelector('[data-field=title]');
    const titleField = BilingualField({ label: 'Title', name: 'title', value: item.title || {}, onChange: () => {} });
    titleWrap._bilingual = titleField;
    titleWrap.appendChild(titleField);

    const tagWrap = cardEl.querySelector('[data-field=tag]');
    const tagField = BilingualField({ label: 'Tag', name: 'tag', value: item.tag || {}, onChange: () => {} });
    tagWrap._bilingual = tagField;
    tagWrap.appendChild(tagField);

    const descWrap = cardEl.querySelector('[data-field=description]');
    const descField = BilingualField({ label: 'Description', name: 'desc', value: item.description || {}, onChange: () => {}, multiline: true });
    descWrap._bilingual = descField;
    descWrap.appendChild(descField);

    const imageWrap = cardEl.querySelector('[data-field=imageUrl]');
    imageField = ImageUploadField({ label: 'Project image', value: item.imageUrl || '' });
    imageWrap.appendChild(imageField);

    cardEl.dataset.showcaseId = item.id;
    list.appendChild(cardEl);
  });

  const getPreviewDraft = () => ({
    showcaseProjects: Array.from(list.querySelectorAll('.crm-card[data-showcase-id]')).map((cardEl) => {
      const imageField = cardEl.querySelector('[data-field=imageUrl] .crm-image-field');
      const publishedInput = cardEl.querySelector('[data-field=published]');
      return {
        id: cardEl.dataset.showcaseId,
        title: cardEl.querySelector('[data-field=title]')._bilingual.getValues(),
        tag: cardEl.querySelector('[data-field=tag]')._bilingual.getValues(),
        description: cardEl.querySelector('[data-field=description]')._bilingual.getValues(),
        imageUrl: imageField && imageField.getValue ? imageField.getValue() : '',
        sortOrder: Number(cardEl.querySelector('[data-field=sortOrder]').value) || 0,
        published: publishedInput ? publishedInput.checked : true,
      };
    }),
  });

  const addBtn = btn('Add project card', 'ghost', async () => {
    try {
      await crmApi.post('/content/showcase', {
        title: { en: 'New project', sq: 'New project' },
        tag: { en: '', sq: '' },
        description: { en: '', sq: '' },
        imageUrl: '',
        sortOrder: items.length,
        published: false,
      });
      showToast('Item added');
      refresh();
    } catch (ex) {
      showToast(ex.message || 'Add failed', 'error');
    }
  });

  const content = el('div', { className: 'crm-cms' }, [list]);
  return renderShell({ title: 'Showcase', currentPath: path, actions: [previewBtn('Preview site', '#projects', getPreviewDraft), addBtn], content });
}
