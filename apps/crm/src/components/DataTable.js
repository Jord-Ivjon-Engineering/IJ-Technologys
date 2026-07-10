import { el, esc } from '../state.js';

export function DataTable({ columns, rows, searchPlaceholder, onRowClick, emptyMessage }) {
  const wrap = el('div', { className: 'crm-table-wrap' });
  const toolbar = el('div', { className: 'crm-table-toolbar' });
  const search = el('input', {
    className: 'crm-input crm-table-search',
    type: 'search',
    placeholder: searchPlaceholder || 'Search…',
  });
  toolbar.appendChild(search);
  wrap.appendChild(toolbar);

  const table = el('table', { className: 'crm-table' });
  const thead = el('thead');
  const headRow = el('tr');
  columns.forEach((col) => {
    const th = el('th', { text: col.label });
    if (col.sortable) {
      th.className = 'sortable';
      th.addEventListener('click', () => sortBy(col.key));
    }
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  table.appendChild(tbody);
  wrap.appendChild(table);

  let data = rows.slice();
  let sortKey = null;
  let sortDir = 1;

  function sortBy(key) {
    if (sortKey === key) sortDir *= -1;
    else { sortKey = key; sortDir = 1; }
    render();
  }

  function filterRows() {
    const q = search.value.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      columns.some((col) => {
        const v = col.raw ? col.raw(row) : row[col.key];
        return String(v ?? '').toLowerCase().includes(q);
      })
    );
  }

  function render() {
    tbody.innerHTML = '';
    let list = filterRows();
    if (sortKey) {
      list = list.slice().sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
        return String(av).localeCompare(String(bv)) * sortDir;
      });
    }
    if (!list.length) {
      const tr = el('tr');
      const td = el('td', { html: esc(emptyMessage || 'No results'), colSpan: String(columns.length) });
      td.className = 'crm-table-empty';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    list.forEach((row) => {
      const tr = el('tr');
      if (onRowClick) {
        tr.className = 'clickable';
        tr.addEventListener('click', () => onRowClick(row));
      }
      columns.forEach((col) => {
        const td = el('td');
        if (col.render) td.appendChild(col.render(row));
        else td.textContent = row[col.key] ?? '—';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  search.addEventListener('input', render);
  wrap.setRows = (newRows) => {
    data = newRows.slice();
    render();
  };
  render();
  return wrap;
}
