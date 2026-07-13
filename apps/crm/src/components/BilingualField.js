import { el } from '../state.js';

export function FormField({ label, input, hint }) {
  return el('div', { className: 'crm-field' }, [
    label ? el('label', { text: label }) : null,
    input,
    hint ? el('span', { className: 'crm-field-hint', text: hint }) : null,
  ]);
}

export function BilingualField({ label, name, value = {}, onChange, multiline, maxLength }) {
  const enVal = value.en || '';
  const sqVal = value.sq || '';
  const wrap = el('div', { className: 'crm-bilingual' });
  if (label) wrap.appendChild(el('span', { className: 'crm-bilingual-label', text: label }));

  const grid = el('div', { className: 'crm-bilingual-grid' });
  let enCounter = null;
  let sqCounter = null;

  const updateCounter = (input, counter) => {
    if (!counter || maxLength == null) return;
    const remaining = Math.max(0, maxLength - input.value.length);
    counter.textContent = `${remaining}/${maxLength}`;
    counter.classList.toggle('is-over', input.value.length > maxLength);
    counter.classList.toggle('is-low', remaining > 0 && remaining <= 20);
  };

  const makeInput = (lang, val) => {
    const attrs = {
      className: 'crm-input',
      'data-lang': lang,
      'data-name': name,
    };
    if (maxLength != null) attrs.maxlength = String(maxLength);
    const node = multiline
      ? el('textarea', { ...attrs, rows: '3' })
      : el('input', { ...attrs, type: 'text' });
    node.value = val;
    node.addEventListener('input', () => {
      onChange({
        en: lang === 'en' ? node.value : enInput.value,
        sq: lang === 'sq' ? node.value : sqInput.value,
      });
      updateCounter(node, lang === 'en' ? enCounter : sqCounter);
    });
    return node;
  };

  const makeCol = (lang, val) => {
    const col = el('div', { className: 'crm-bilingual-col' }, [
      el('span', { className: 'crm-lang-tag', text: lang.toUpperCase() }),
    ]);
    const input = makeInput(lang, val);
    col.appendChild(input);
    if (maxLength != null) {
      const counter = el('span', {
        className: 'crm-char-count',
        text: `${Math.max(0, maxLength - val.length)}/${maxLength}`,
        'aria-live': 'polite',
      });
      col.appendChild(counter);
      if (lang === 'en') enCounter = counter;
      else sqCounter = counter;
    }
    return { col, input };
  };

  const enCol = makeCol('en', enVal);
  const sqCol = makeCol('sq', sqVal);
  const enInput = enCol.input;
  const sqInput = sqCol.input;
  grid.appendChild(enCol.col);
  grid.appendChild(sqCol.col);
  wrap.appendChild(grid);

  wrap.getValues = () => ({ en: enInput.value, sq: sqInput.value });
  wrap.setValues = (v) => {
    enInput.value = v.en || '';
    sqInput.value = v.sq || '';
    updateCounter(enInput, enCounter);
    updateCounter(sqInput, sqCounter);
  };
  wrap.isValid = () => {
    if (maxLength == null) return true;
    return enInput.value.length <= maxLength && sqInput.value.length <= maxLength;
  };

  return wrap;
}
