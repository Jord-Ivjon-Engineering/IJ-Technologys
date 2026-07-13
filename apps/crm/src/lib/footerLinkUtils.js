// Mirror of frontend/js/footerLinkUtils.js — keep in sync.
const FOOTER_ICON_RULES = [
  { domains: ['youtu.be'], icon: '▶' },
  { domains: ['instagram.com', 'instagr.am'], icon: '◎' },
  { domains: ['facebook.com', 'fb.com', 'fb.me'], icon: 'Ⓕ' },
  { domains: ['linkedin.com', 'lnkd.in'], icon: 'in' },
  { domains: ['twitter.com', 'x.com'], icon: '\u{1D54F}' },
  { domains: ['youtube.com'], icon: '▶' },
  { domains: ['tiktok.com'], icon: '♪' },
  { domains: ['github.com'], icon: '⌘' },
  { domains: ['wa.me', 'whatsapp.com'], icon: '☎' },
  { domains: ['t.me', 'telegram.me', 'telegram.org'], icon: '✈' },
  { domains: ['threads.net'], icon: '@' },
  { domains: ['pinterest.com'], icon: 'P' },
  { domains: ['discord.com', 'discord.gg'], icon: '♆' },
  { domains: ['bsky.app'], icon: 'B' },
  { domains: ['vimeo.com'], icon: 'V' },
  { domains: ['spotify.com'], icon: '♫' },
];

function isBareEmail(value) {
  if (!value || value.includes('/') || value.includes('://')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeFooterUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.trim();
  if (!t) return '';
  const lower = t.toLowerCase();
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return t;
  if (t.startsWith('#')) return t;
  if (isBareEmail(t)) return t;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d+)?(?:[/?#]|$)/i.test(t)) {
    return `https://${t}`;
  }
  return t;
}

function hostMatches(host, domains) {
  if (!host) return false;
  return domains.some((d) => host === d || (host.length > d.length + 1 && host.slice(-d.length - 1) === `.${d}`));
}

export function footerLinkHost(raw) {
  try {
    return new URL(normalizeFooterUrl(raw)).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export function footerLinkIcon(raw) {
  const t = (raw || '').trim();
  const lower = t.toLowerCase();
  if (!t) return '·';
  if (lower.startsWith('mailto:') || isBareEmail(t)) return '✉';
  if (lower.startsWith('tel:')) return '✆';
  if (t.startsWith('#')) return '→';
  const host = footerLinkHost(t);
  for (const rule of FOOTER_ICON_RULES) {
    if (hostMatches(host, rule.domains)) return rule.icon;
  }
  return '↗';
}

export function safeHttpUrlForFooter(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const u = new URL(normalizeFooterUrl(raw.trim()));
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
    return null;
  } catch {
    return null;
  }
}
