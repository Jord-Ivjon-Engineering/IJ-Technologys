(function (root) {
  'use strict';
  // Keep in sync with apps/crm/src/lib/footerLinkUtils.js

  var FOOTER_ICON_RULES = [
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
    if (!value || value.indexOf('/') >= 0 || value.indexOf('://') >= 0) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function normalizeFooterUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    var t = raw.trim();
    if (!t) return '';
    var lower = t.toLowerCase();
    if (lower.indexOf('mailto:') === 0 || lower.indexOf('tel:') === 0) return t;
    if (t.charAt(0) === '#') return t;
    if (isBareEmail(t)) return t;
    if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
    if (t.indexOf('//') === 0) return 'https:' + t;
    if (/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d+)?(?:[/?#]|$)/i.test(t)) {
      return 'https://' + t;
    }
    return t;
  }

  function hostMatches(host, domains) {
    if (!host) return false;
    for (var i = 0; i < domains.length; i++) {
      var d = domains[i];
      if (host === d || (host.length > d.length + 1 && host.slice(-d.length - 1) === '.' + d)) return true;
    }
    return false;
  }

  function footerLinkHost(raw) {
    try {
      return new URL(normalizeFooterUrl(raw)).hostname.replace(/^www\./, '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function footerLinkIcon(raw) {
    var t = (raw || '').trim();
    var lower = t.toLowerCase();
    if (!t) return '·';
    if (lower.indexOf('mailto:') === 0 || isBareEmail(t)) return '✉';
    if (lower.indexOf('tel:') === 0) return '✆';
    if (t.charAt(0) === '#') return '→';
    var host = footerLinkHost(t);
    for (var i = 0; i < FOOTER_ICON_RULES.length; i++) {
      if (hostMatches(host, FOOTER_ICON_RULES[i].domains)) return FOOTER_ICON_RULES[i].icon;
    }
    return '↗';
  }

  function safeHttpUrlForFooter(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try {
      var u = new URL(normalizeFooterUrl(raw.trim()));
      if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
      return null;
    } catch (e) {
      return null;
    }
  }

  var api = {
    normalizeFooterUrl: normalizeFooterUrl,
    footerLinkHost: footerLinkHost,
    footerLinkIcon: footerLinkIcon,
    safeHttpUrlForFooter: safeHttpUrlForFooter,
  };

  root.ijFooterLinkUtils = api;
})(typeof window !== 'undefined' ? window : globalThis);
