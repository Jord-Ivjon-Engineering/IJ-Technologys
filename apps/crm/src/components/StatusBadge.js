import { el } from '../state.js';

const STATUS_MAP = {
  active: { label: 'Active', class: 'status-active' },
  lead: { label: 'Lead', class: 'status-lead' },
  past: { label: 'Past', class: 'status-inactive' },
  inactive: { label: 'Inactive', class: 'status-inactive' },
  inquiry: { label: 'Inquiry', class: 'status-lead' },
  scoping: { label: 'Scoping', class: 'status-read' },
  review: { label: 'Review', class: 'status-hold' },
  done: { label: 'Done', class: 'status-completed' },
  maintenance: { label: 'Maintenance', class: 'status-active' },
  completed: { label: 'Completed', class: 'status-completed' },
  on_hold: { label: 'On hold', class: 'status-hold' },
  cancelled: { label: 'Cancelled', class: 'status-cancelled' },
  new: { label: 'New', class: 'status-new' },
  read: { label: 'Read', class: 'status-read' },
  replied: { label: 'Replied', class: 'status-replied' },
  converted: { label: 'Converted', class: 'status-completed' },
  archived: { label: 'Archived', class: 'status-archived' },
  pending: { label: 'Pending', class: 'status-pending' },
  published: { label: 'Published', class: 'status-published' },
  rejected: { label: 'Rejected', class: 'status-rejected' },
};

export function StatusBadge(status) {
  const cfg = STATUS_MAP[status] || { label: status || '—', class: 'status-default' };
  return el('span', { className: 'crm-badge ' + cfg.class, text: cfg.label });
}
