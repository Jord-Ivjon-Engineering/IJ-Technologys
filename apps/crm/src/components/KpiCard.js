import { el } from '../state.js';

export function KpiCard({ label, value, sub, trend, variant, onClick }) {
  const classes = ['crm-kpi'];
  if (variant) classes.push('crm-kpi-' + variant);
  if (onClick) classes.push('crm-kpi-action');

  const inner = [
    el('span', { className: 'crm-kpi-label', text: label }),
    el('strong', { className: 'crm-kpi-value', text: value }),
    sub ? el('span', { className: 'crm-kpi-sub', text: sub }) : null,
    trend ? el('span', { className: 'crm-kpi-trend', text: trend }) : null,
  ];

  if (onClick) {
    const btn = el('button', { className: classes.join(' '), type: 'button' }, inner);
    btn.addEventListener('click', onClick);
    return btn;
  }

  return el('div', { className: classes.join(' ') }, inner);
}
