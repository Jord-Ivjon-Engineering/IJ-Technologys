import { fetchSiteSettings, saveSiteSettings } from '../../api.js';
import { el } from '../../state.js';
import { BilingualField } from '../../components/BilingualField.js';
import { showToast } from '../../components/Toast.js';
import { renderShell, btn, sectionCard, errorBlock } from '../../components/shell.js';
import { previewBtn } from '../../components/SitePreviewModal.js';

export async function renderWebsiteHero({ path }) {
  let settings;
  try {
    settings = await fetchSiteSettings();
  } catch (err) {
    return renderShell({ title: 'Hero & stats', currentPath: path, content: errorBlock(err.message) });
  }

  const hero = settings.hero || {};
  const stats = settings.stats || {};
  const fields = {};
  const fieldDefs = [
    ['label', 'Section label'],
    ['title', 'Headline'],
    ['lead', 'Lead paragraph', true],
    ['ctaPrimary', 'Primary CTA'],
    ['ctaSecondary', 'Secondary CTA'],
    ['cardTitle', 'Hero card title'],
    ['cardMeta', 'Hero card meta'],
    ['hintDesktop', 'Globe hint (desktop)'],
    ['hintMobile', 'Globe hint (mobile)'],
  ];

  const heroFields = [];
  fieldDefs.forEach(([key, label, multiline]) => {
    fields[key] = BilingualField({ label, name: key, value: hero[key] || {}, onChange: () => {}, multiline });
    heroFields.push(fields[key]);
  });

  const ctaPlan = el('input', { className: 'crm-input', value: hero.ctaPrimaryPlan || 'Pro' });

  const statFields = [
    ['projectsLaunched', 'projectsLaunchedLabel', 'Projects launched'],
    ['happyClients', 'happyClientsLabel', 'Happy clients'],
    ['countriesReached', 'countriesReachedLabel', 'Countries reached'],
  ];

  const statInputs = [];
  const statRows = [];
  statFields.forEach(([valueKey, labelKey, title]) => {
    const row = el('div', { className: 'crm-stats-row' });
    const value = el('input', { className: 'crm-input', type: 'number', value: String(stats[valueKey] || 0) });
    const label = BilingualField({ label: title, name: labelKey, value: stats[labelKey] || {}, onChange: () => {} });
    row.appendChild(el('label', { text: 'Value' }));
    row.appendChild(value);
    row.appendChild(label);
    statRows.push(row);
    statInputs.push({ valueKey, labelKey, value, label });
  });

  const stack = el('div', { className: 'crm-cms-stack' }, [
    sectionCard('Hero', [
      ...heroFields,
      el('label', { text: 'Primary CTA plan (contact prefill)' }),
      ctaPlan,
    ]),
    sectionCard('Stats', statRows),
  ]);

  const saveBtn = btn('Save', 'primary', async () => {
    try {
      const nextHero = { ...hero };
      Object.keys(fields).forEach((k) => { nextHero[k] = fields[k].getValues(); });
      nextHero.ctaPrimaryPlan = ctaPlan.value.trim() || 'Pro';
      const nextStats = { ...stats };
      statInputs.forEach((s) => {
        nextStats[s.valueKey] = Number(s.value.value) || 0;
        nextStats[s.labelKey] = s.label.getValues();
      });
      await saveSiteSettings({ ...settings, hero: nextHero, stats: nextStats });
      showToast('Hero saved');
    } catch (ex) {
      showToast(ex.message || 'Save failed', 'error');
    }
  });

  const getPreviewDraft = () => {
    const nextHero = { ...hero };
    Object.keys(fields).forEach((k) => { nextHero[k] = fields[k].getValues(); });
    nextHero.ctaPrimaryPlan = ctaPlan.value.trim() || 'Pro';
    const nextStats = { ...stats };
    statInputs.forEach((s) => {
      nextStats[s.valueKey] = Number(s.value.value) || 0;
      nextStats[s.labelKey] = s.label.getValues();
    });
    return { settings: { hero: nextHero, stats: nextStats } };
  };

  const content = el('div', { className: 'crm-cms' }, [stack]);
  return renderShell({ title: 'Hero & stats', currentPath: path, actions: [previewBtn('Preview site', '#about', getPreviewDraft), saveBtn], content });
}
