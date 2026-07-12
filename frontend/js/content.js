(function () {
  // Live-embed thumbnails: render each iframe at a virtual desktop width and
  // scale it down so the whole site layout fits inside the small card, instead
  // of showing a zoomed-in crop. Frames are tracked so they can be re-fit on
  // resize / breakpoint changes.
  var EMBED_VIRTUAL_WIDTH = 1280;
  var embedFrames = [];
  var embedResizeBound = false;

  function fitEmbedFrame(entry) {
    var thumb = entry.thumb;
    var frame = entry.frame;
    if (!thumb || !frame || !thumb.isConnected) return;
    var w = thumb.clientWidth;
    var h = thumb.clientHeight;
    if (!w || !h) return;
    var scale = w / EMBED_VIRTUAL_WIDTH;
    frame.style.width = EMBED_VIRTUAL_WIDTH + 'px';
    frame.style.height = Math.ceil(h / scale) + 'px';
    frame.style.transform = 'scale(' + scale + ')';
    frame.style.transformOrigin = 'top left';
  }

  function fitAllEmbedFrames() {
    embedFrames = embedFrames.filter(function (e) { return e.frame && e.frame.isConnected; });
    embedFrames.forEach(fitEmbedFrame);
  }

  function registerEmbedFrame(thumb, frame) {
    var entry = { thumb: thumb, frame: frame };
    embedFrames.push(entry);
    // Fit now (thumb has a fixed height + CSS width) and again next frame once
    // layout has settled.
    fitEmbedFrame(entry);
    requestAnimationFrame(function () { fitEmbedFrame(entry); });
    if (!embedResizeBound) {
      embedResizeBound = true;
      window.addEventListener('resize', fitAllEmbedFrames, { passive: true });
      document.addEventListener('ij-cms-ready', fitAllEmbedFrames);
    }
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function safeHttpUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      var u = new URL(url.trim(), window.location.origin);
      if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
      return null;
    } catch (e) {
      return null;
    }
  }

  function safeMailto(email) {
    if (!email || typeof email !== 'string') return null;
    var trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
    return 'mailto:' + trimmed;
  }

  // Resolve a footer link's raw value into a safe href. Supports full http(s)
  // URLs, mailto:/bare emails, tel:, and in-page #anchors — anything else is
  // rejected so a bad value can't inject an unsafe scheme.
  function footerLinkHref(url) {
    if (!url || typeof url !== 'string') return null;
    var t = url.trim();
    if (!t) return null;
    var lower = t.toLowerCase();
    if (lower.indexOf('mailto:') === 0) return safeMailto(t.slice(7).split('?')[0]) ? t : null;
    if (lower.indexOf('tel:') === 0) {
      var num = t.slice(4).trim();
      return /^[+0-9().\-\s]{3,}$/.test(num) ? 'tel:' + num.replace(/\s+/g, '') : null;
    }
    if (t.charAt(0) === '#') return /^#[\w-]+$/.test(t) ? t : null;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return safeMailto(t);
    return safeHttpUrl(t);
  }

  // Pick a footer icon glyph purely from the URL — the CRM never stores one.
  function footerLinkIcon(url) {
    var t = (url || '').trim();
    var lower = t.toLowerCase();
    if (lower.indexOf('mailto:') === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return '✉'; // ✉
    if (lower.indexOf('tel:') === 0) return '✆'; // ✆
    if (t.charAt(0) === '#') return '→'; // →
    var host = '';
    try { host = new URL(t, window.location.origin).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) {}
    if (/instagram\.com/.test(host)) return '◎'; // ◎
    if (/(facebook\.com|fb\.com|fb\.me)/.test(host)) return 'Ⓕ'; // ⓕ
    if (/linkedin\.com/.test(host)) return 'in';
    if (/(twitter\.com|x\.com)/.test(host)) return '\u{1D54F}'; // 𝕏
    if (/(youtube\.com|youtu\.be)/.test(host)) return '▶'; // ▶
    if (/tiktok\.com/.test(host)) return '♪'; // ♪
    if (/github\.com/.test(host)) return '⌘'; // ⌘
    if (/(wa\.me|whatsapp\.com)/.test(host)) return '☎'; // ☎
    if (/(t\.me|telegram)/.test(host)) return '✈'; // ✈
    return '↗'; // ↗ generic external link
  }

  function renderFooterLinks(links) {
    var container = document.getElementById('footLinks');
    if (!container) return;
    container.innerHTML = '';
    (links || []).forEach(function (link) {
      if (!link) return;
      var rawUrl = link.url || '';
      var href = footerLinkHref(rawUrl);
      if (!href) return;
      var a = document.createElement('a');
      a.href = href;
      if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      // Preserve the old "request a call" nicety: a footer link to #contact
      // prefills the contact form message if it's still empty.
      if (href === '#contact') {
        a.addEventListener('click', function () {
          var msg = document.getElementById('cf-message');
          if (msg && !msg.value.trim()) {
            msg.value = document.documentElement.lang === 'sq'
              ? 'Do të doja një telefonatë për të diskutuar projektin.'
              : 'I would like a call to discuss my project.';
          }
        });
      }
      var ic = document.createElement('span');
      ic.className = 'ic';
      ic.setAttribute('aria-hidden', 'true');
      ic.textContent = footerLinkIcon(rawUrl);
      a.appendChild(ic);
      var label = document.createElement('span');
      setBilingual(label, link.label || {});
      a.appendChild(label);
      container.appendChild(a);
    });
  }

  function setBilingual(el, obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.en) el.setAttribute('data-en', obj.en);
    if (obj.sq) el.setAttribute('data-sq', obj.sq);
    var lang = document.documentElement.lang || 'en';
    var t = obj[lang] || obj.en || obj.sq;
    if (t) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) el.placeholder = t;
      } else {
        el.textContent = t;
      }
    }
  }

  function applyTextHook(el, value) {
    if (value == null) return;
    if (typeof value === 'object') setBilingual(el, value);
    else {
      el.textContent = value;
      el.setAttribute('data-en', value);
      el.setAttribute('data-sq', value);
    }
  }

  function planLabel(plan) {
    if (typeof plan.name === 'object') return plan.name.en || plan.name.sq || plan.slug || '';
    return plan.name || plan.slug || '';
  }

  function normalizePayload(raw) {
    if (!raw || !raw.ok) return null;
    var c = raw.content || raw;
    var settings = c.settings || {};
    var hero = settings.hero || c.hero || {};
    var stats = settings.stats || {};
    var statsArr = [
      { value: stats.projectsLaunched, suffix: '+', label: stats.projectsLaunchedLabel },
      { value: stats.happyClients, suffix: '+', label: stats.happyClientsLabel },
      { value: stats.countriesReached, suffix: '+', label: stats.countriesReachedLabel },
    ].filter(function (s) { return s.label; });

    var sectionsList = c.sections || [];
    var bySlug = {};
    sectionsList.forEach(function (s) { bySlug[s.slug] = s; });

    var work = bySlug.work;
    var suit = bySlug.suit;
    var review = bySlug.review;
    var projectsMeta = settings.projects || {};
    var pricingMeta = settings.pricing || {};
    var sectionVis = settings.sectionVisibility || {};

    var sections = {
      projectsHeadline: projectsMeta.title,
      projectsSub: projectsMeta.subtitleDesktop || projectsMeta.subtitle,
      projectsSubMobile: projectsMeta.subtitleMobile,
      pricingTitle: pricingMeta.title,
      pricingSub: pricingMeta.subtitle,
      workTitle: work && work.content && work.content.title,
      workBody: work && work.content && work.content.body,
      workFeatures: work && work.content && work.content.features,
      suitTitle: suit && suit.content && suit.content.title,
      suitBody: suit && suit.content && suit.content.body,
      suitImage: suit && suit.content && suit.content.imageUrl,
      suitCta: suit && suit.content && suit.content.cta,
      contactTitle: settings.contact && settings.contact.title,
      contactSub: settings.contact && settings.contact.subtitle,
      contactSteps: settings.contact && settings.contact.steps,
      reviewTitle: review && review.content && review.content.title,
      reviewSub: review && review.content && review.content.subtitle,
      stripText: settings.strip && settings.strip.text,
      enabled: {
        work: Object.prototype.hasOwnProperty.call(sectionVis, 'work') ? sectionVis.work : false,
        suit: Object.prototype.hasOwnProperty.call(sectionVis, 'suit') ? sectionVis.suit : false,
        contact: Boolean(settings.contact && Object.keys(settings.contact).length),
        strip: Boolean(settings.strip && Object.keys(settings.strip).length),
        review: Object.prototype.hasOwnProperty.call(sectionVis, 'review') ? sectionVis.review : false,
      },
    };

    var showcase = c.showcaseProjects || c.showcase || [];
    var plans = (c.pricingPlans || (c.pricing && c.pricing.plans) || []).map(function (p) {
      return {
        id: p.id,
        slug: p.slug,
        name: p.name || p.slug,
        priceLabel: p.priceLabel || p.price,
        perLabel: p.perLabel || p.period,
        features: p.features || [],
        highlighted: p.highlighted,
        published: p.published !== false,
        sortOrder: p.sortOrder,
      };
    });

    return {
      ok: true,
      settings: {
        logoText: settings.logoText,
        contactEmail: (settings.footer && settings.footer.email) || settings.contactEmail,
        contactPhone: settings.footer && settings.footer.phone,
        footerTagline: settings.footer && settings.footer.tagline,
        footerCopyright: settings.footer && settings.footer.copyright,
        footerCredit: settings.footer && settings.footer.credit,
        footerInstagram: settings.footer && settings.footer.instagram,
        footerRequestCall: settings.footer && settings.footer.requestCall,
        footerLinksHeading: settings.footer && settings.footer.linksHeading,
        footerLinks: (settings.footer && settings.footer.links) || [],
      },
      hero: Object.assign({}, hero, {
        stats: statsArr.length ? statsArr : hero.stats,
        ctaPrimaryPlan: hero.ctaPrimaryPlan || 'Pro',
      }),
      showcase: showcase,
      pricing: {
        plans: plans,
        note: pricingMeta.note || (c.pricing && c.pricing.note),
      },
      sections: sections,
    };
  }

  function renderStats(container, stats) {
    if (!container || !stats || !stats.length) return;
    container.innerHTML = '';
    stats.forEach(function (st) {
      var stat = document.createElement('div');
      stat.className = 'stat';
      var b = document.createElement('b');
      b.setAttribute('data-count', String(st.value || 0));
      b.textContent = String(st.value || 0) + (st.suffix || '');
      var span = document.createElement('span');
      setBilingual(span, st.label || {});
      stat.appendChild(b);
      stat.appendChild(span);
      container.appendChild(stat);
    });
    if (typeof window.ijRefreshCounters === 'function') window.ijRefreshCounters();
  }

  function parseBilingualTag(tag) {
    if (tag == null || tag === '') return null;
    if (typeof tag === 'object') return tag;
    if (typeof tag === 'string' && tag.trim().startsWith('{')) {
      try {
        var parsed = JSON.parse(tag);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return { en: tag, sq: tag };
  }

  function renderShowcase(ring, items) {
    if (!ring) return;
    ring.innerHTML = '';
    embedFrames = [];
    if (!items || !items.length) return;
    items.forEach(function (item, i) {
      var article = document.createElement('article');
      article.className = 'pcard';
      article.style.setProperty('--i', String(i));
      var thumb = document.createElement('div');
      thumb.className = 'thumb';
      var embedFrame = null;
      var titleText = typeof item.title === 'object' ? (item.title.en || item.title.sq || '') : (item.title || '');
      if (item.embedUrl) {
        // Live project embed: render the actual site in an iframe instead of a
        // static image. Sandboxed so an embedded page can't script the host.
        thumb.classList.add('thumb-embed');
        var frame = document.createElement('iframe');
        frame.src = item.embedUrl;
        frame.loading = 'lazy';
        frame.title = titleText;
        frame.setAttribute('scrolling', 'no');
        frame.setAttribute('tabindex', '-1');
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
        frame.setAttribute('referrerpolicy', 'no-referrer');
        frame.addEventListener('load', fitAllEmbedFrames);
        thumb.appendChild(frame);
        embedFrame = frame;
      } else {
        var img = document.createElement('img');
        img.loading = 'lazy';
        img.src = item.imageUrl || '';
        img.alt = titleText;
        thumb.appendChild(img);
      }
      var body = document.createElement('div');
      body.className = 'body';
      var tag = document.createElement('span');
      tag.className = 'tag';
      var tagVal = parseBilingualTag(item.tag);
      if (tagVal) setBilingual(tag, tagVal);
      var h3 = document.createElement('h3');
      if (typeof item.title === 'object') setBilingual(h3, item.title);
      else h3.textContent = item.title || '';
      var p = document.createElement('p');
      setBilingual(p, item.description || {});
      body.appendChild(tag);
      body.appendChild(h3);
      body.appendChild(p);
      article.appendChild(thumb);
      article.appendChild(body);
      // Whole card opens the live project in a new tab when it has an embed URL.
      var linkUrl = item.embedUrl;
      if (linkUrl) {
        article.classList.add('pcard-link');
        article.setAttribute('role', 'link');
        article.setAttribute('tabindex', '0');
        article.setAttribute('aria-label', titleText ? titleText + ' — open project' : 'Open project');
        var openLink = function () { window.open(linkUrl, '_blank', 'noopener,noreferrer'); };
        article.addEventListener('click', openLink);
        article.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLink(); }
        });
      }
      ring.appendChild(article);
      if (embedFrame) registerEmbedFrame(thumb, embedFrame);
    });
    if (typeof window.ijSyncRing === 'function') window.ijSyncRing();
  }

  function renderPricing(grid, data) {
    if (!grid || !data || !data.plans) return;
    var plans = data.plans.filter(function (p) { return p.published !== false; });
    plans.sort(function (a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
    grid.innerHTML = '';
    plans.forEach(function (plan, i) {
      var planName = planLabel(plan);
      var div = document.createElement('div');
      div.className = 'plan' + (plan.highlighted ? ' pro' : '') + (i ? ' reveal d' + i : ' reveal');
      if (plan.highlighted) {
        var flag = document.createElement('span');
        flag.className = 'flag';
        setBilingual(flag, { en: 'Most chosen', sq: 'Më i zgjedhuri' });
        div.appendChild(flag);
      }
      var h3 = document.createElement('h3');
      h3.textContent = planName;
      var price = document.createElement('div');
      price.className = 'price';
      if (plan.priceLabel) {
        if (typeof plan.priceLabel === 'object') setBilingual(price, plan.priceLabel);
        else price.textContent = plan.priceLabel;
      } else if (typeof plan.price === 'object') setBilingual(price, plan.price);
      else price.textContent = plan.price || '';
      var per = document.createElement('div');
      per.className = 'per';
      if (plan.perLabel) setBilingual(per, plan.perLabel);
      else setBilingual(per, plan.period || {});
      var ul = document.createElement('ul');
      (plan.features || []).forEach(function (f) {
        var li = document.createElement('li');
        setBilingual(li, typeof f === 'object' ? f : { en: f, sq: f });
        ul.appendChild(li);
      });
      var cta = document.createElement('a');
      cta.className = 'btn plan-cta' + (plan.highlighted ? ' primary' : '');
      cta.href = '#contact';
      cta.setAttribute('data-plan', planName);
      setBilingual(cta, { en: 'Start with ' + planName, sq: 'Nis me ' + planName });
      div.appendChild(h3);
      div.appendChild(price);
      div.appendChild(per);
      div.appendChild(ul);
      div.appendChild(cta);
      grid.appendChild(div);
    });
    syncPackageSelect(plans);
    if (data.note) {
      var note = document.querySelector('[data-cms="pricing.note"]');
      if (note) setBilingual(note, data.note);
    }
  }

  function syncPackageSelect(plans) {
    var select = document.getElementById('cf-package');
    if (!select || !plans || !plans.length) return;
    var current = select.value;
    while (select.options.length > 1) select.remove(1);
    plans.forEach(function (plan) {
      var name = planLabel(plan);
      var price = typeof plan.priceLabel === 'object'
        ? (plan.priceLabel.en || plan.priceLabel.sq || '')
        : (plan.priceLabel || '');
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = price ? name + ' (' + price + ')' : name;
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function renderFeatureList(list, features) {
    if (!list || !features || !features.length) return;
    list.innerHTML = '';
    features.forEach(function (f) {
      var li = document.createElement('li');
      var ic = document.createElement('span');
      ic.className = 'ic';
      ic.innerHTML = '<svg viewBox="0 0 24 24"><path d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z"/></svg>';
      var span = document.createElement('span');
      setBilingual(span, typeof f === 'object' ? f : { en: f, sq: f });
      li.appendChild(ic);
      li.appendChild(span);
      list.appendChild(li);
    });
  }

  function renderContactSteps(container, steps) {
    if (!container || !steps || !steps.length) return;
    container.innerHTML = '';
    steps.forEach(function (step) {
      var span = document.createElement('span');
      setBilingual(span, typeof step === 'object' ? step : { en: step, sq: step });
      container.appendChild(span);
    });
  }

  function applyContent(data) {
    if (!data || !data.ok) return false;

    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var key = el.getAttribute('data-cms');
      if (!key || key.indexOf('.') === -1) return;
      var parts = key.split('.');
      var section = data[parts[0]];
      if (!section) return;
      var val = section;
      for (var i = 1; i < parts.length; i++) val = val && val[parts[i]];
      if (val != null) applyTextHook(el, val);
    });

    var heroLabel = document.querySelector('[data-cms="hero.label"]');
    if (heroLabel && data.hero && data.hero.label) setBilingual(heroLabel, data.hero.label);
    var heroTitle = document.querySelector('[data-cms="hero.title"]');
    if (heroTitle && data.hero && data.hero.title) setBilingual(heroTitle, data.hero.title);
    var heroLead = document.querySelector('[data-cms="hero.lead"]');
    if (heroLead && data.hero && data.hero.lead) setBilingual(heroLead, data.hero.lead);
    var heroCta1 = document.querySelector('[data-cms="hero.ctaPrimary"]');
    if (heroCta1 && data.hero) {
      setBilingual(heroCta1, data.hero.ctaPrimary || {});
      if (data.hero.ctaPrimaryPlan) heroCta1.setAttribute('data-plan', data.hero.ctaPrimaryPlan);
    }
    var heroCta2 = document.querySelector('[data-cms="hero.ctaSecondary"]');
    if (heroCta2 && data.hero && data.hero.ctaSecondary) setBilingual(heroCta2, data.hero.ctaSecondary);
    var cardTitle = document.querySelector('[data-cms="hero.cardTitle"]');
    if (cardTitle && data.hero && data.hero.cardTitle) setBilingual(cardTitle, data.hero.cardTitle);
    var cardMeta = document.querySelector('[data-cms="hero.cardMeta"]');
    if (cardMeta && data.hero && data.hero.cardMeta) setBilingual(cardMeta, data.hero.cardMeta);
    var hintDesktop = document.querySelector('.hint-desktop');
    if (hintDesktop && data.hero && data.hero.hintDesktop) setBilingual(hintDesktop, data.hero.hintDesktop);
    var hintMobile = document.querySelector('.hint-mobile');
    if (hintMobile && data.hero && data.hero.hintMobile) setBilingual(hintMobile, data.hero.hintMobile);

    var statsEl = document.querySelector('[data-cms="stats"]');
    if (statsEl && data.hero && data.hero.stats) renderStats(statsEl, data.hero.stats);

    var ring = document.getElementById('ring');
    if (ring && data.showcase) renderShowcase(ring, data.showcase);

    var offerGrid = document.querySelector('[data-cms="pricing"]');
    if (offerGrid && data.pricing) renderPricing(offerGrid, data.pricing);

    if (data.sections) {
      var sec = data.sections;
      var map = {
        'sections.projectsHeadline': sec.projectsHeadline,
        'sections.projectsSub': sec.projectsSub,
        'sections.projectsSubMobile': sec.projectsSubMobile,
        'sections.pricingTitle': sec.pricingTitle,
        'sections.pricingSub': sec.pricingSub,
        'sections.workTitle': sec.workTitle,
        'sections.workBody': sec.workBody,
        'sections.suitTitle': sec.suitTitle,
        'sections.suitBody': sec.suitBody,
        'sections.contactTitle': sec.contactTitle,
        'sections.contactSub': sec.contactSub,
        'sections.reviewTitle': sec.reviewTitle,
        'sections.reviewSub': sec.reviewSub,
      };
      Object.keys(map).forEach(function (k) {
        var node = document.querySelector('[data-cms="' + k + '"]');
        if (node && map[k]) setBilingual(node, map[k]);
      });
      var strip = document.querySelector('[data-cms="sections.stripText"]');
      if (strip && sec.stripText) setBilingual(strip, sec.stripText);
      renderFeatureList(document.getElementById('workFeatures'), sec.workFeatures);
      renderContactSteps(document.getElementById('contactSteps'), sec.contactSteps);
      if (sec.suitImage) {
        var suitImg = document.querySelector('.suit-img img');
        if (suitImg) {
          suitImg.src = sec.suitImage;
          suitImg.alt = '';
        }
      }
      if (sec.suitCta) {
        var suitCta = document.querySelector('.suit-copy .plan-cta');
        if (suitCta) setBilingual(suitCta, sec.suitCta);
      }
      if (sec.enabled) {
        var work = document.getElementById('work');
        var suit = document.querySelector('.suit');
        var contact = document.getElementById('contact');
        var stripWrap = document.querySelector('.strip');
        var review = document.getElementById('review');
        if (work) work.hidden = !sec.enabled.work;
        if (suit) suit.hidden = !sec.enabled.suit;
        if (contact) contact.hidden = !sec.enabled.contact;
        if (stripWrap) stripWrap.hidden = !sec.enabled.strip;
        if (review) review.hidden = !sec.enabled.review;
      }
    }

    if (data.settings) {
      var logoSpan = document.querySelector('.logo span');
      if (logoSpan && data.settings.logoText) logoSpan.textContent = data.settings.logoText;
      var footTagline = document.querySelector('[data-cms="footer.tagline"]');
      if (footTagline && data.settings.footerTagline) setBilingual(footTagline, data.settings.footerTagline);
      var footCopy = document.querySelector('[data-cms="footer.copyright"]');
      if (footCopy && data.settings.footerCopyright) setBilingual(footCopy, data.settings.footerCopyright);
      var footCredit = document.querySelector('[data-cms="footer.credit"]');
      if (footCredit && data.settings.footerCredit) setBilingual(footCredit, data.settings.footerCredit);
      var footLinksHead = document.querySelector('[data-cms="footer.linksHeading"]');
      if (footLinksHead && data.settings.footerLinksHeading) setBilingual(footLinksHead, data.settings.footerLinksHeading);
      renderFooterLinks(data.settings.footerLinks);
    }

    document.dispatchEvent(new CustomEvent('ij-cms-ready'));
    return true;
  }

  function isPreviewMode() {
    try {
      return /(?:^|[?&])cms-preview=1(?:&|$)/.test(window.location.search);
    } catch (e) {
      return false;
    }
  }

  var pendingPreviewDraft = null;

  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin) return;
    if (!e.data || e.data.type !== 'ij-cms-preview-draft') return;
    pendingPreviewDraft = e.data.draft || null;
    if (isPreviewMode()) window.ijLoadCmsContent();
  });

  function readPreviewDraft() {
    if (!isPreviewMode()) return null;
    if (pendingPreviewDraft) return pendingPreviewDraft;
    try {
      var raw = sessionStorage.getItem('ij-cms-preview');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function isPlainObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  function deepMerge(a, b) {
    if (!b) return a;
    var out = Object.assign({}, a || {});
    Object.keys(b).forEach(function (key) {
      if (isPlainObject(b[key]) && isPlainObject(out[key])) out[key] = deepMerge(out[key], b[key]);
      else out[key] = b[key];
    });
    return out;
  }

  function mergeSections(base, draft) {
    var bySlug = {};
    (base || []).forEach(function (s) {
      if (s && s.slug) bySlug[s.slug] = s;
    });
    (draft || []).forEach(function (s) {
      if (!s || !s.slug) return;
      var prev = bySlug[s.slug] || { slug: s.slug };
      bySlug[s.slug] = {
        slug: s.slug,
        content: deepMerge(prev.content || {}, s.content || {}),
      };
    });
    return Object.values(bySlug);
  }

  function mergePublicContent(base, draft) {
    if (!draft || !base) return base;
    var out = Object.assign({}, base);
    if (draft.settings) out.settings = deepMerge(out.settings || {}, draft.settings);
    if (draft.showcaseProjects) {
      var inPreview = isPreviewMode();
      var showcase = draft.showcaseProjects.slice().sort(function (a, b) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }).filter(function (item) {
        return inPreview || item.published !== false;
      }).map(function (item) {
        return {
          id: item.id,
          tag: item.tag,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
          embedUrl: item.embedUrl,
        };
      });
      out.showcaseProjects = showcase;
      out.showcase = showcase;
    }
    if (draft.pricingPlans) {
      var inPreview = isPreviewMode();
      var plans = draft.pricingPlans.slice().sort(function (a, b) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }).filter(function (plan) {
        return inPreview || plan.published !== false;
      }).map(function (plan) {
        return {
          id: plan.id,
          slug: plan.slug,
          name: plan.name,
          priceLabel: plan.priceLabel,
          perLabel: plan.perLabel,
          features: plan.features || [],
          highlighted: plan.highlighted,
          published: plan.published !== false,
          sortOrder: plan.sortOrder,
        };
      });
      out.pricingPlans = plans;
      out.pricing = plans;
    }
    if (draft.sections) out.sections = mergeSections(out.sections, draft.sections);
    return out;
  }

  function showPreviewBanner() {
    if (!isPreviewMode()) return;
    if (document.getElementById('ij-cms-preview-banner')) return;
    var bar = document.createElement('div');
    bar.id = 'ij-cms-preview-banner';
    bar.className = 'ij-cms-preview-banner';
    bar.textContent = 'Preview — unsaved changes';
    document.body.prepend(bar);
  }

  window.ijLoadCmsContent = function () {
    var draft = readPreviewDraft();
    showPreviewBanner();
    return fetch('/api/content/public')
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (data && data.content && draft) {
          data.content = mergePublicContent(data.content, draft);
        }
        var normalized = normalizePayload(data);
        if (normalized && applyContent(normalized)) {
          window.ijCmsLoaded = true;
          if (typeof window.setLang === 'function') {
            var lang = 'en';
            try { lang = localStorage.getItem('ij-lang') || 'en'; } catch (e) {}
            window.setLang(lang);
          }
        }
        return normalized;
      })
      .catch(function () { return null; });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.ijLoadCmsContent(); });
  } else {
    window.ijLoadCmsContent();
  }
})();
