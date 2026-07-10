let session = null;
let adminVerified = false;
const listeners = new Set();

export function getSession() {
  return session;
}

export function setSession(s) {
  const prevUserId = session?.user?.id ?? null;
  const nextUserId = s?.user?.id ?? null;
  session = s;
  if (prevUserId === nextUserId && prevUserId != null) return;
  notify();
}

export function isAdminVerified() {
  return adminVerified;
}

export function setAdminVerified(v) {
  if (adminVerified === v) return;
  adminVerified = v;
  notify();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn({ session, adminVerified }));
}

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return '€' + v.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}

export function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v != null) node.setAttribute(k, v);
    });
  }
  if (children != null) {
    const list = Array.isArray(children) ? children : [children];
    list.forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
  }
  return node;
}
