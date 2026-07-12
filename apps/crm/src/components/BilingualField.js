import { el } from '../state.js';

export function FormField({ label, input, hint }) {
  return el('div', { className: 'crm-field' }, [
    label ? el('label', { text: label }) : null,
    input,
    hint ? el('span', { className: 'crm-field-hint', text: hint }) : null,
  ]);
}

export function BilingualField({ label, name, value = {}, onChange, multiline }) {
  const enVal = value.en || '';
  const sqVal = value.sq || '';
  const wrap = el('div', { className: 'crm-bilingual' });
  if (label) wrap.appendChild(el('span', { className: 'crm-bilingual-label', text: label }));

  const grid = el('div', { className: 'crm-bilingual-grid' });
  const makeInput = (lang, val) => {
    const attrs = {
      className: 'crm-input',
      'data-lang': lang,
      'data-name': name,
    };
    const node = multiline
      ? el('textarea', { ...attrs, rows: '3' })
      : el('input', { ...attrs, type: 'text' });
    // Set via the .value property, not an attribute: a <textarea> ignores a
    // `value` attribute (its initial text comes from child content), so the
    // saved description would otherwise render blank on load.
    node.value = val;
    node.addEventListener('input', () => {
      onChange({
        en: lang === 'en' ? node.value : enInput.value,
        sq: lang === 'sq' ? node.value : sqInput.value,
      });
    });
    return node;
  };

  const enCol = el('div', { className: 'crm-bilingual-col' }, [
    el('span', { className: 'crm-lang-tag', text: 'EN' }),
  ]);
  const sqCol = el('div', { className: 'crm-bilingual-col' }, [
    el('span', { className: 'crm-lang-tag', text: 'SQ' }),
  ]);
  const enInput = makeInput('en', enVal);
  const sqInput = makeInput('sq', sqVal);
  enCol.appendChild(enInput);
  sqCol.appendChild(sqInput);
  grid.appendChild(enCol);
  grid.appendChild(sqCol);
  wrap.appendChild(grid);

  wrap.getValues = () => ({ en: enInput.value, sq: sqInput.value });
  wrap.setValues = (v) => {
    enInput.value = v.en || '';
    sqInput.value = v.sq || '';
  };

  return wrap;
}
