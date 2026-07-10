import { crmApi, fetchSections, fetchSiteSettings, saveSiteSettings } from '../../api.js';
import { el } from '../../state.js';
import { BilingualField } from '../../components/BilingualField.js';
import { ImageUploadField } from '../../components/ImageUploadField.js';
import { showToast } from '../../components/Toast.js';
import { renderShell, btn, sectionCard, errorBlock } from '../../components/shell.js';
import { previewBtn } from '../../components/SitePreviewModal.js';

function buildFeatureList(features) {
  const wrap = el('div', { className: 'crm-pricing-features' });
  const rows = [];

  function render() {
    wrap.innerHTML = '';
    rows.forEach((row, fi) => {
      const rowEl = el('div', { className: 'crm-feature-row' });
      const bf = BilingualField({
        label: 'Bullet ' + (fi + 1),
        name: 'bullet' + fi,
        value: row.value,
        onChange: (v) => { row.value = v; },
      });
      rowEl._bilingual = bf;
      rowEl.appendChild(bf);
      rowEl.appendChild(btn('Remove', 'ghost', () => {
        rows.splice(fi, 1);
        render();
      }));
      wrap.appendChild(rowEl);
    });
  }

  (features || []).forEach((feat) => {
    rows.push({ value: typeof feat === 'object' ? feat : { en: feat, sq: feat } });
  });
  render();

  return {
    el: wrap,
    add: () => { rows.push({ value: { en: '', sq: '' } }); render(); },
    getValues: () => Array.from(wrap.querySelectorAll('.crm-feature-row')).map((row) => row._bilingual.getValues()),
  };
}

function buildStepsList(steps) {
  const wrap = el('div', { className: 'crm-contact-steps' });
  const rows = [];

  function render() {
    wrap.innerHTML = '';
    rows.forEach((row, i) => {
      const rowEl = el('div', { className: 'crm-feature-row' });
      const bf = BilingualField({ label: 'Step ' + (i + 1), name: 'step' + i, value: row.value, onChange: (v) => { row.value = v; } });
      rowEl._bilingual = bf;
      rowEl.appendChild(bf);
      rowEl.appendChild(btn('Remove', 'ghost', () => { rows.splice(i, 1); render(); }));
      wrap.appendChild(rowEl);
    });
  }

  (steps || []).forEach((step) => {
    rows.push({ value: typeof step === 'object' ? step : { en: step, sq: step } });
  });
  render();

  return {
    el: wrap,
    add: () => { rows.push({ value: { en: '', sq: '' } }); render(); },
    getValues: () => Array.from(wrap.querySelectorAll('.crm-feature-row')).map((row) => row._bilingual.getValues()),
  };
}

export async function renderWebsiteSections({ path }) {
  let sections;
  let settings;
  try {
    [sections, settings] = await Promise.all([fetchSections(), fetchSiteSettings()]);
  } catch (err) {
    return renderShell({ title: 'Sections', currentPath: path, content: errorBlock(err.message) });
  }

  const bySlug = Object.fromEntries(sections.map((s) => [s.slug, s]));
  const work = bySlug.work?.content || {};
  const suit = bySlug.suit?.content || {};
  const review = bySlug.review?.content || {};
  const projects = settings.projects || {};
  const contact = settings.contact || {};
  const strip = settings.strip || {};

  const projectsTitle = BilingualField({ label: 'Headline', name: 'projectsTitle', value: projects.title || {}, onChange: () => {} });
  const projectsSub = BilingualField({ label: 'Subtitle (desktop)', name: 'projectsSub', value: projects.subtitleDesktop || {}, onChange: () => {}, multiline: true });
  const projectsSubMobile = BilingualField({ label: 'Subtitle (mobile)', name: 'projectsSubMobile', value: projects.subtitleMobile || {}, onChange: () => {}, multiline: true });

  const workTitle = BilingualField({ label: 'Title', name: 'workTitle', value: work.title || {}, onChange: () => {} });
  const workBody = BilingualField({ label: 'Body', name: 'workBody', value: work.body || {}, onChange: () => {}, multiline: true });
  const workFeatures = buildFeatureList(work.features || []);
  const workEnabled = el('input', { type: 'checkbox', checked: bySlug.work?.enabled !== false ? 'true' : undefined });

  const suitTitle = BilingualField({ label: 'Title', name: 'suitTitle', value: suit.title || {}, onChange: () => {} });
  const suitBody = BilingualField({ label: 'Body', name: 'suitBody', value: suit.body || {}, onChange: () => {}, multiline: true });
  const suitImage = ImageUploadField({ label: 'Image', value: suit.imageUrl || '' });
  const suitCta = BilingualField({ label: 'CTA label', name: 'suitCta', value: suit.cta || {}, onChange: () => {} });
  const suitEnabled = el('input', { type: 'checkbox', checked: bySlug.suit?.enabled !== false ? 'true' : undefined });

  const contactTitle = BilingualField({ label: 'Title', name: 'contactTitle', value: contact.title || {}, onChange: () => {} });
  const contactSub = BilingualField({ label: 'Subtitle', name: 'contactSub', value: contact.subtitle || {}, onChange: () => {}, multiline: true });
  const contactSteps = buildStepsList(contact.steps || []);

  const reviewTitle = BilingualField({ label: 'Title', name: 'reviewTitle', value: review.title || {}, onChange: () => {} });
  const reviewSub = BilingualField({ label: 'Subtitle', name: 'reviewSub', value: review.subtitle || {}, onChange: () => {}, multiline: true });
  const reviewEnabled = el('input', { type: 'checkbox', checked: bySlug.review?.enabled !== false ? 'true' : undefined });

  const stripText = BilingualField({ label: 'Strip text', name: 'stripText', value: strip.text || {}, onChange: () => {} });

  const stack = el('div', { className: 'crm-cms-stack' }, [
    sectionCard('Projects globe', [projectsTitle, projectsSub, projectsSubMobile]),
    sectionCard('Work section', [
      workTitle,
      workBody,
      el('label', { text: 'Feature bullets' }),
      workFeatures.el,
      btn('Add bullet', 'ghost', () => workFeatures.add()),
      el('label', { className: 'crm-check' }, [workEnabled, el('span', { text: 'Show work section' })]),
    ]),
    sectionCard('Suit block', [
      suitTitle,
      suitBody,
      suitImage,
      suitCta,
      el('label', { className: 'crm-check' }, [suitEnabled, el('span', { text: 'Show suit section' })]),
    ]),
    sectionCard('Contact', [
      contactTitle,
      contactSub,
      el('label', { text: 'Steps' }),
      contactSteps.el,
      btn('Add step', 'ghost', () => contactSteps.add()),
    ]),
    sectionCard('Reviews section', [
      reviewTitle,
      reviewSub,
      el('label', { className: 'crm-check' }, [reviewEnabled, el('span', { text: 'Show reviews section' })]),
    ]),
    sectionCard('Marquee strip', [stripText]),
  ]);

  const saveBtn = btn('Save', 'primary', async () => {
    try {
      await saveSiteSettings({
        ...settings,
        projects: {
          ...projects,
          title: projectsTitle.getValues(),
          subtitleDesktop: projectsSub.getValues(),
          subtitleMobile: projectsSubMobile.getValues(),
        },
        contact: {
          ...contact,
          title: contactTitle.getValues(),
          subtitle: contactSub.getValues(),
          steps: contactSteps.getValues(),
        },
        strip: { ...strip, text: stripText.getValues() },
      });
      if (bySlug.work?.id) {
        await crmApi.patch('/content/sections/' + bySlug.work.id, {
          enabled: workEnabled.checked,
          content: { ...work, title: workTitle.getValues(), body: workBody.getValues(), features: workFeatures.getValues() },
        });
      }
      if (bySlug.suit?.id) {
        await crmApi.patch('/content/sections/' + bySlug.suit.id, {
          enabled: suitEnabled.checked,
          content: {
            ...suit,
            title: suitTitle.getValues(),
            body: suitBody.getValues(),
            imageUrl: suitImage.getValue(),
            cta: suitCta.getValues(),
          },
        });
      }
      if (bySlug.review?.id) {
        await crmApi.patch('/content/sections/' + bySlug.review.id, {
          enabled: reviewEnabled.checked,
          content: { ...review, title: reviewTitle.getValues(), subtitle: reviewSub.getValues() },
        });
      }
      showToast('Sections saved');
    } catch (ex) {
      showToast(ex.message || 'Save failed', 'error');
    }
  });

  const getPreviewDraft = () => ({
    settings: {
      projects: {
        title: projectsTitle.getValues(),
        subtitleDesktop: projectsSub.getValues(),
        subtitleMobile: projectsSubMobile.getValues(),
      },
      contact: {
        title: contactTitle.getValues(),
        subtitle: contactSub.getValues(),
        steps: contactSteps.getValues(),
      },
      strip: { text: stripText.getValues() },
      sectionVisibility: {
        work: workEnabled.checked,
        suit: suitEnabled.checked,
        review: reviewEnabled.checked,
      },
    },
    sections: [
      {
        slug: 'work',
        content: {
          title: workTitle.getValues(),
          body: workBody.getValues(),
          features: workFeatures.getValues(),
        },
      },
      {
        slug: 'suit',
        content: {
          title: suitTitle.getValues(),
          body: suitBody.getValues(),
          imageUrl: suitImage.getValue(),
          cta: suitCta.getValues(),
        },
      },
      {
        slug: 'review',
        content: {
          title: reviewTitle.getValues(),
          subtitle: reviewSub.getValues(),
        },
      },
    ],
  });

  const content = el('div', { className: 'crm-cms' }, [stack]);
  return renderShell({ title: 'Sections', currentPath: path, actions: [previewBtn('Preview site', '', getPreviewDraft), saveBtn], content });
}
