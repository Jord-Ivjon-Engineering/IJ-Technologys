import { crmApi, fetchPricingPlans, fetchSiteSettings, saveSiteSettings } from '../../api.js';
import { el } from '../../state.js';
import { BilingualField } from '../../components/BilingualField.js';
import { showToast } from '../../components/Toast.js';
import { renderShell, btn, card, cardFooter, sectionCard, toggleBtn, errorBlock } from '../../components/shell.js';
import { previewBtn } from '../../components/SitePreviewModal.js';
import { refresh } from '../../router.js';

function planLabel(name, slug) {
  if (typeof name === 'object') return name.en || name.sq || slug || 'Plan';
  return name || slug || 'Plan';
}

function priceLabelValue(val) {
  if (val == null) return '';
  if (typeof val === 'object') return val.en || val.sq || '';
  return String(val);
}

function buildFeatureList(features, onChange) {
  const wrap = el('div', { className: 'crm-pricing-features' });
  const rows = [];

  function render() {
    wrap.innerHTML = '';
    rows.forEach((row, fi) => {
      const rowEl = el('div', { className: 'crm-feature-row' });
      const bf = BilingualField({
        label: 'Feature ' + (fi + 1),
        name: 'feat' + fi,
        value: row.value,
        onChange: (v) => { row.value = v; onChange(); },
        multiline: true,
      });
      rowEl._bilingual = bf;
      rowEl.appendChild(bf);
      const remove = btn('Remove', 'ghost', () => {
        rows.splice(fi, 1);
        render();
        onChange();
      });
      rowEl.appendChild(remove);
      wrap.appendChild(rowEl);
    });
  }

  (features || []).forEach((feat) => {
    rows.push({
      value: typeof feat === 'object' ? feat : { en: feat, sq: feat },
    });
  });
  render();

  return {
    el: wrap,
    addFeature: () => {
      rows.push({ value: { en: '', sq: '' } });
      render();
    },
    getValues: () => rows.map((row) => {
      const node = wrap.querySelectorAll('.crm-feature-row')[rows.indexOf(row)];
      return node?._bilingual?.getValues() || row.value;
    }).filter(Boolean),
    syncFromDom: () => Array.from(wrap.querySelectorAll('.crm-feature-row')).map((row) => row._bilingual.getValues()),
  };
}

export async function renderWebsitePricing({ path }) {
  let plans;
  let settings;
  try {
    [plans, settings] = await Promise.all([fetchPricingPlans(), fetchSiteSettings()]);
  } catch (err) {
    return renderShell({ title: 'Pricing', currentPath: path, content: errorBlock(err.message) });
  }

  const pricingSettings = settings.pricing || {};
  const list = el('div', { className: 'crm-cms-stack' });

  const pricingTitle = BilingualField({ label: 'Section title', name: 'pricingTitle', value: pricingSettings.title || {}, onChange: () => {} });
  const pricingSub = BilingualField({ label: 'Section subtitle', name: 'pricingSub', value: pricingSettings.subtitle || {}, onChange: () => {}, multiline: true });
  const noteField = BilingualField({ label: 'Pricing footnote', name: 'note', value: pricingSettings.note || {}, onChange: () => {} });

  list.appendChild(sectionCard('Pricing section', [
    pricingTitle,
    pricingSub,
    noteField,
    btn('Save section copy', 'ghost', async () => {
      try {
        await saveSiteSettings({
          ...settings,
          pricing: {
            ...pricingSettings,
            title: pricingTitle.getValues(),
            subtitle: pricingSub.getValues(),
            note: noteField.getValues(),
          },
        });
        showToast('Pricing section saved');
      } catch (ex) {
        showToast(ex.message || 'Save failed', 'error');
      }
    }),
  ]));

  plans.forEach((plan) => {
    const featuresList = buildFeatureList(plan.features || [], () => {});

    const cardEl = card([
      el('div', { className: 'crm-card-head' }, [
        el('h4', { text: planLabel(plan.name, plan.slug) }),
        btn('Remove', 'danger', async () => {
          try {
            await crmApi.delete('/content/pricing/' + plan.id);
            showToast('Plan removed');
            refresh();
          } catch (ex) {
            showToast(ex.message || 'Remove failed', 'error');
          }
        }),
      ]),
      el('label', { text: 'Slug' }),
      el('input', { className: 'crm-input', value: plan.slug || '', 'data-field': 'slug' }),
      el('div', { 'data-field': 'name' }),
      el('label', { text: 'Price label' }),
      el('p', { className: 'crm-field-hint', text: 'Leave empty for a contact-only card (no price, “Contact us” button).' }),
      el('input', { className: 'crm-input', value: priceLabelValue(plan.priceLabel), 'data-field': 'priceLabel', placeholder: 'e.g. 2000 ALL' }),
      el('div', { 'data-field': 'perLabel' }),
      el('label', { text: 'Sort order' }),
      el('input', { className: 'crm-input', type: 'number', value: String(plan.sortOrder ?? 0), 'data-field': 'sortOrder' }),
      el('label', { text: 'Features' }),
      featuresList.el,
      btn('Add feature', 'ghost', () => featuresList.addFeature()),
      cardFooter([
        toggleBtn('Highlighted', { checked: plan.highlighted, dataField: 'highlighted' }),
        toggleBtn('Published', { checked: plan.published !== false, dataField: 'published', offLabel: 'Draft' }),
        btn('Save plan', 'primary', async () => {
          try {
            await crmApi.patch('/content/pricing/' + plan.id, {
              slug: cardEl.querySelector('[data-field=slug]').value.trim(),
              name: cardEl.querySelector('[data-field=name]')._bilingual.getValues(),
              priceLabel: cardEl.querySelector('[data-field=priceLabel]').value.trim(),
              perLabel: cardEl.querySelector('[data-field=perLabel]')._bilingual.getValues(),
              features: featuresList.syncFromDom(),
              sortOrder: Number(cardEl.querySelector('[data-field=sortOrder]').value) || 0,
              highlighted: cardEl.querySelector('[data-field=highlighted]').checked,
              published: cardEl.querySelector('[data-field=published]').checked,
            });
            showToast('Plan saved');
          } catch (ex) {
            showToast(ex.message || 'Save failed', 'error');
          }
        }),
      ]),
    ]);

    const nameWrap = cardEl.querySelector('[data-field=name]');
    const nameField = BilingualField({ label: 'Name', name: 'name', value: plan.name || {}, onChange: () => {} });
    nameWrap._bilingual = nameField;
    nameWrap.appendChild(nameField);

    const perWrap = cardEl.querySelector('[data-field=perLabel]');
    const perField = BilingualField({ label: 'Period label', name: 'per', value: plan.perLabel || {}, onChange: () => {} });
    perWrap._bilingual = perField;
    perWrap.appendChild(perField);

    cardEl.dataset.pricingId = plan.id;
    list.appendChild(cardEl);
  });

  const getPreviewDraft = () => ({
    settings: {
      pricing: {
        title: pricingTitle.getValues(),
        subtitle: pricingSub.getValues(),
        note: noteField.getValues(),
      },
    },
    pricingPlans: Array.from(list.querySelectorAll('.crm-card[data-pricing-id]')).map((cardEl) => ({
      id: cardEl.dataset.pricingId,
      slug: cardEl.querySelector('[data-field=slug]').value.trim(),
      name: cardEl.querySelector('[data-field=name]')._bilingual.getValues(),
      priceLabel: cardEl.querySelector('[data-field=priceLabel]').value.trim(),
      perLabel: cardEl.querySelector('[data-field=perLabel]')._bilingual.getValues(),
      features: Array.from(cardEl.querySelectorAll('.crm-feature-row')).map((row) => row._bilingual.getValues()),
      sortOrder: Number(cardEl.querySelector('[data-field=sortOrder]').value) || 0,
      highlighted: cardEl.querySelector('[data-field=highlighted]').checked,
      published: cardEl.querySelector('[data-field=published]').checked,
    })),
  });

  const addBtn = btn('Add plan', 'ghost', async () => {
    try {
      await crmApi.post('/content/pricing', {
        slug: 'new-plan-' + Date.now(),
        name: { en: 'New plan', sq: 'New plan' },
        priceLabel: '',
        perLabel: { en: '', sq: '' },
        features: [],
        highlighted: false,
        published: false,
        sortOrder: plans.length,
      });
      showToast('Plan added');
      refresh();
    } catch (ex) {
      showToast(ex.message || 'Add failed', 'error');
    }
  });

  const content = el('div', { className: 'crm-cms' }, [list]);
  return renderShell({ title: 'Pricing', currentPath: path, actions: [previewBtn('Preview site', '#offers', getPreviewDraft), addBtn], content });
}
