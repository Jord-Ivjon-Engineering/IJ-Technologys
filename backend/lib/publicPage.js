'use strict';

const fs = require('fs');
const path = require('path');

require('../../frontend/js/footerLinkUtils');

const footerLinks = global.ijFooterLinkUtils;
const TEMPLATE_PATH = path.join(__dirname, '..', '..', 'frontend', 'index.html');
const ORIGIN = 'https://www.ij-technology.com';

const TITLES = {
  en: 'IJ Technology — Websites, shops & digital products',
  sq: 'IJ Technology — Faqe interneti, dyqane dhe produkte dixhitale',
};

let templateCache = null;

function templateHtml() {
  if (!templateCache) templateCache = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  return templateCache;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textOf(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const primary = lang === 'sq' ? value.sq : value.en;
    const fallback = lang === 'sq' ? value.en : value.sq;
    return String(primary || fallback || '');
  }
  return String(value);
}

function bilingualAttrs(value) {
  if (value == null) return '';
  const en = typeof value === 'string' ? value : (value.en || value.sq || '');
  const sq = typeof value === 'string' ? value : (value.sq || value.en || '');
  if (!en && !sq) return '';
  return ` data-en="${esc(en)}" data-sq="${esc(sq)}"`;
}

function hasText(value) {
  return Boolean(textOf(value, 'en') || textOf(value, 'sq'));
}

function cmsPattern(key) {
  return 'data-cms="' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"';
}

function fillCms(html, key, value, lang) {
  if (!hasText(value)) return html;
  const re = new RegExp('(<([a-zA-Z0-9]+)\\b[^>]*\\s' + cmsPattern(key) + '[^>]*)(>)[\\s\\S]*?(</\\2>)');
  return html.replace(re, (match, open, tag, gt, close) => {
    const attrs = open.replace(/\sdata-en="[^"]*"/g, '').replace(/\sdata-sq="[^"]*"/g, '');
    return attrs + bilingualAttrs(value) + gt + esc(textOf(value, lang)) + close;
  });
}

function fillRaw(html, attr, inner) {
  const re = new RegExp('(<([a-zA-Z0-9]+)\\b[^>]*\\s' + attr + '[^>]*>)[\\s\\S]*?(</\\2>)');
  if (!re.test(html)) return html;
  return html.replace(re, (match, open, tag, close) => open + inner + close);
}

function planName(plan) {
  if (!plan) return '';
  if (typeof plan.name === 'object') return plan.name.en || plan.name.sq || plan.slug || '';
  return plan.name || plan.slug || '';
}

function planPrice(plan) {
  const label = plan.priceLabel != null && plan.priceLabel !== '' ? plan.priceLabel : plan.price;
  return textOf(label, 'en').trim();
}

function parseTag(tag) {
  if (tag == null || tag === '') return null;
  if (typeof tag === 'object') return tag;
  if (typeof tag === 'string' && tag.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(tag);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (err) {}
  }
  return { en: tag, sq: tag };
}

function footerHref(url) {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower.startsWith('mailto:')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.slice(7).split('?')[0]) ? t : null;
  }
  if (lower.startsWith('tel:')) {
    const num = t.slice(4).trim();
    return /^[+0-9().\-\s]{3,}$/.test(num) ? 'tel:' + num.replace(/\s+/g, '') : null;
  }
  if (t.charAt(0) === '#') return /^#[\w-]+$/.test(t) ? t : null;
  if (t.indexOf('/') >= 0 || t.indexOf('://') >= 0) return footerLinks.safeHttpUrlForFooter(t);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'mailto:' + t;
  return footerLinks.safeHttpUrlForFooter(t);
}

function normalizePublic(data) {
  const settings = (data && data.settings) || {};
  const hero = settings.hero || {};
  const stats = settings.stats || {};
  const statsArr = [
    { value: stats.projectsLaunched, suffix: '+', label: stats.projectsLaunchedLabel },
    { value: stats.happyClients, suffix: '+', label: stats.happyClientsLabel },
    { value: stats.countriesReached, suffix: '+', label: stats.countriesReachedLabel },
  ].filter((item) => item.label);

  const bySlug = {};
  (data.sections || []).forEach((section) => { bySlug[section.slug] = section; });
  const work = bySlug.work;
  const suit = bySlug.suit;
  const review = bySlug.review;
  const projectsMeta = settings.projects || {};
  const pricingMeta = settings.pricing || {};
  const sectionVis = settings.sectionVisibility || {};
  const plans = (data.pricingPlans || []).map((plan) => ({
    id: plan.id,
    slug: plan.slug,
    name: plan.name || plan.slug,
    priceLabel: plan.priceLabel || plan.price,
    perLabel: plan.perLabel || plan.period,
    features: plan.features || [],
    highlighted: plan.highlighted,
    published: plan.published !== false,
    sortOrder: plan.sortOrder,
  })).filter((plan) => plan.published !== false);

  return {
    hero: Object.assign({}, hero, {
      stats: statsArr.length ? statsArr : hero.stats,
      ctaPrimaryPlan: hero.ctaPrimaryPlan || 'Pro',
    }),
    showcase: data.showcaseProjects || [],
    pricing: { plans, note: pricingMeta.note },
    sections: {
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
    },
    footer: settings.footer || {},
  };
}

function metaDescription(value, lang) {
  const clean = textOf(value, lang).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= 160) return clean;
  const sentence = clean.split('. ')[0];
  if (sentence && sentence.length <= 160) return sentence.endsWith('.') ? sentence : sentence + '.';
  return clean.slice(0, 157).replace(/\s+\S*$/, '').trim() + '…';
}

function pageUrl(lang) {
  return lang === 'sq' ? ORIGIN + '/sq' : ORIGIN + '/';
}

function jsonScript(id, value) {
  const json = JSON.stringify(value).replace(/</g, '\\u003c');
  return `<script type="application/json" id="${id}">${json}</script>`;
}

function priceParts(label) {
  const text = String(label || '');
  const amount = text.replace(/[^\d.,]/g, '').replace(/,/g, '');
  if (!amount) return null;
  const currency = /ALL|lek/i.test(text) ? 'ALL' : '';
  return { amount, currency };
}

function sameAsLinks(footer) {
  const urls = [];
  if (footer.instagram) {
    const href = footerLinks.safeHttpUrlForFooter(footer.instagram);
    if (href) urls.push(href);
  }
  (footer.links || []).forEach((link) => {
    const href = footerHref(link && link.url);
    if (href && /^https?:/i.test(href) && urls.indexOf(href) === -1) urls.push(href);
  });
  return urls;
}

function contactEmail(footer) {
  const link = (footer.links || []).find((item) => footerHref(item && item.url) && String(footerHref(item.url)).startsWith('mailto:'));
  if (link) return footerHref(link.url).replace(/^mailto:/i, '').split('?')[0];
  if (footer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(footer.email))) return footer.email;
  return '';
}

function structuredData(model, reviews, lang) {
  const url = pageUrl(lang);
  const description = metaDescription(model.hero.lead || model.footer.tagline, lang);
  const orgId = ORIGIN + '/#organization';
  const org = {
    '@type': 'Organization',
    '@id': orgId,
    name: 'IJ Technology',
    url: ORIGIN + '/',
    logo: ORIGIN + '/images/logo.png',
    description: textOf(model.hero.lead || model.footer.tagline, 'en'),
    email: contactEmail(model.footer) || undefined,
    sameAs: sameAsLinks(model.footer),
    knowsAbout: textOf(model.sections.stripText, 'en').split('◆').map((part) => part.trim()).filter(Boolean),
  };
  if (reviews.length) {
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    org.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (total / reviews.length).toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
    };
  }
  const graph = [
    org,
    {
      '@type': 'WebSite',
      '@id': ORIGIN + '/#website',
      url: ORIGIN + '/',
      name: 'IJ Technology',
      inLanguage: ['en', 'sq'],
      publisher: { '@id': orgId },
    },
    {
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url,
      name: TITLES[lang] || TITLES.en,
      description,
      inLanguage: lang,
      isPartOf: { '@id': ORIGIN + '/#website' },
      about: { '@id': orgId },
    },
  ];
  model.pricing.plans.forEach((plan) => {
    const offer = {
      '@type': 'Offer',
      name: planName(plan),
      description: (plan.features || []).map((feature) => textOf(feature, lang)).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
      url: url + '#offers',
      availability: 'https://schema.org/InStock',
      seller: { '@id': orgId },
    };
    const price = priceParts(planPrice(plan));
    if (price) {
      offer.price = price.amount;
      if (price.currency) offer.priceCurrency = price.currency;
    }
    graph.push(offer);
  });
  reviews.forEach((review) => {
    graph.push({
      '@type': 'Review',
      author: { '@type': 'Person', name: review.name },
      reviewBody: review.text,
      reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5 },
      itemReviewed: { '@id': orgId },
    });
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

function statsHtml(stats, lang) {
  return (stats || []).map((item) => {
    const value = item.value || 0;
    return `<div class="stat"><b data-count="${esc(value)}">${esc(value)}${esc(item.suffix || '')}</b><span${bilingualAttrs(item.label)}>${esc(textOf(item.label, lang))}</span></div>`;
  }).join('');
}

function featuresHtml(features, lang) {
  return (features || []).map((feature) => {
    return `<li><span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z"/></svg></span><span${bilingualAttrs(feature)}>${esc(textOf(feature, lang))}</span></li>`;
  }).join('');
}

function stepsHtml(steps, lang) {
  return (steps || []).map((step) => `<span${bilingualAttrs(step)}>${esc(textOf(step, lang))}</span>`).join('');
}

function showcaseHtml(items, lang) {
  return (items || []).map((item, index) => {
    const title = item.title;
    const titleText = textOf(title, lang);
    const tag = parseTag(item.tag);
    const href = footerLinks.safeHttpUrlForFooter(item.embedUrl || '');
    const tagName = href ? 'a' : 'article';
    const linkAttrs = href ? ` href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : '';
    const thumbClass = item.imageUrl ? 'thumb' : 'thumb thumb-empty';
    const img = item.imageUrl
      ? `<img loading="lazy" src="${esc(item.imageUrl)}" alt="${esc(titleText)}"${bilingualAttrs(title)}>`
      : '';
    return `<${tagName} class="pcard${href ? ' pcard-link' : ''}" style="--i:${index}"${linkAttrs}><div class="${thumbClass}">${img}</div><div class="body">${tag ? `<span class="tag"${bilingualAttrs(tag)}>${esc(textOf(tag, lang))}</span>` : ''}<h3${bilingualAttrs(title)}>${esc(titleText)}</h3><p${bilingualAttrs(item.description)}>${esc(textOf(item.description, lang))}</p></div></${tagName}>`;
  }).join('');
}

function pricingHtml(plans, lang) {
  return plans.map((plan, index) => {
    const name = planName(plan);
    const price = planPrice(plan);
    const contactOnly = !price;
    const classes = ['plan', plan.highlighted ? 'pro' : '', contactOnly ? 'plan-contact' : '', index ? 'reveal d' + index : 'reveal'].filter(Boolean).join(' ');
    const flag = plan.highlighted
      ? `<span class="flag"${bilingualAttrs({ en: 'Most chosen', sq: 'Më i zgjedhuri' })}>${esc(textOf({ en: 'Most chosen', sq: 'Më i zgjedhuri' }, lang))}</span>`
      : '';
    const priceHtml = contactOnly ? '' : `<div class="price"${bilingualAttrs(plan.priceLabel || price)}>${esc(textOf(plan.priceLabel || price, lang))}</div>`;
    const per = plan.perLabel && hasText(plan.perLabel)
      ? `<div class="per"${bilingualAttrs(plan.perLabel)}>${esc(textOf(plan.perLabel, lang))}</div>`
      : '';
    const features = (plan.features || []).map((feature) => `<li${bilingualAttrs(feature)}>${esc(textOf(feature, lang))}</li>`).join('');
    const cta = contactOnly
      ? { en: 'Contact us', sq: 'Na kontaktoni' }
      : { en: 'Start with ' + name, sq: 'Nis me ' + name };
    return `<div class="${classes}">${flag}<h3>${esc(name)}</h3>${priceHtml}${per}<ul>${features}</ul><a class="btn plan-cta${plan.highlighted ? ' primary' : ''}" href="#contact" data-plan="${esc(name)}"${bilingualAttrs(cta)}>${esc(textOf(cta, lang))}</a></div>`;
  }).join('');
}

function packageOptions(plans) {
  return plans.map((plan) => {
    const name = planName(plan);
    const price = planPrice(plan);
    const label = price ? name + ' (' + price + ')' : name;
    return `<option value="${esc(name)}"${bilingualAttrs(label)}>${esc(label)}</option>`;
  }).join('');
}

function footerHtml(links, lang) {
  return (links || []).map((link) => {
    const href = footerHref(link && link.url);
    if (!href) return '';
    const external = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
    const icon = footerLinks.footerLinkIcon(link.url || '');
    return `<a href="${esc(href)}"${external}><span class="ic" aria-hidden="true">${esc(icon)}</span><span${bilingualAttrs(link.label)}>${esc(textOf(link.label, lang))}</span></a>`;
  }).join('');
}

function reviewsHtml(reviews) {
  return (reviews || []).map((review) => {
    const rating = Math.max(1, Math.min(5, parseInt(review.rating, 10) || 5));
    const empty = 5 - rating;
    const stars = '★'.repeat(rating) + (empty ? `<span class="stars-empty">${'☆'.repeat(empty)}</span>` : '');
    const parts = String(review.name || '').trim().split(/\s+/).filter(Boolean);
    const initials = ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '') || 'C').toUpperCase();
    return `<div class="tcard is-review"><span class="stars" aria-hidden="true">${stars}</span><p>${esc(review.text || '')}</p><div class="who"><span class="avatar" aria-hidden="true">${esc(initials)}</span><span><b>${esc(review.name || 'Anonymous')}</b><span>${esc(review.role || 'Client')}</span></span></div></div>`;
  }).join('');
}

function applyStaticLang(html, lang) {
  if (lang !== 'sq') return html;
  html = html.replace(/<(input|textarea)\b([^>]*?)>/gi, (full, tag, attrs) => {
    const sq = attrs.match(/\sdata-sq="([^"]*)"/);
    if (!sq || !/\splaceholder=/.test(attrs)) return full;
    return '<' + tag + attrs.replace(/\splaceholder="[^"]*"/, ' placeholder="' + sq[1] + '"') + '>';
  });
  return html.replace(/<([a-zA-Z0-9]+)\b([^>]*\sdata-sq="([^"]*)"[^>]*)>([^<]*)<\/\1>/g, (full, tag, attrs, sq) => {
    return '<' + tag + attrs + '>' + sq + '</' + tag + '>';
  });
}

function markLang(html, lang) {
  html = html.replace('<html lang="en">', '<html lang="' + (lang === 'sq' ? 'sq' : 'en') + '">');
  html = html.replace(/ id="btn-en" class="active"/g, ' id="btn-en"');
  html = html.replace(/ id="btn-en-menu" class="active"/g, ' id="btn-en-menu"');
  const active = lang === 'sq' ? ['btn-sq', 'btn-sq-menu'] : ['btn-en', 'btn-en-menu'];
  active.forEach((id) => {
    html = html.replace(' id="' + id + '"', ' id="' + id + '" class="active"');
  });
  return html;
}

function setSectionHidden(html, marker, hidden) {
  if (!hidden) return html;
  const re = new RegExp(marker);
  return html.replace(re, (tag) => tag.includes(' hidden') ? tag : tag.replace(/>$/, ' hidden>'));
}

function headTags(model, reviews, lang) {
  const url = pageUrl(lang);
  const title = TITLES[lang] || TITLES.en;
  const description = metaDescription(model.hero.lead || model.footer.tagline, lang);
  const schema = structuredData(model, reviews, lang);
  const schemaJson = JSON.stringify(schema).replace(/</g, '\\u003c');
  return [
    `<title>${esc(title)}</title>`,
    description ? `<meta name="description" content="${esc(description)}">` : '',
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" hreflang="en" href="${ORIGIN}/">`,
    `<link rel="alternate" hreflang="sq" href="${ORIGIN}/sq">`,
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="IJ Technology">`,
    `<meta property="og:title" content="${esc(title)}">`,
    description ? `<meta property="og:description" content="${esc(description)}">` : '',
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${ORIGIN}/images/logo.png">`,
    `<meta property="og:locale" content="${lang === 'sq' ? 'sq_AL' : 'en_US'}">`,
    `<meta property="og:locale:alternate" content="${lang === 'sq' ? 'en_US' : 'sq_AL'}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    description ? `<meta name="twitter:description" content="${esc(description)}">` : '',
    `<script type="application/ld+json">${schemaJson}</script>`,
  ].filter(Boolean).join('\n');
}

function buildHomeHtml(template, content, reviews, lang) {
  const pageLang = lang === 'sq' ? 'sq' : 'en';
  const model = normalizePublic(content || {});
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, headTags(model, safeReviews, pageLang));
  html = markLang(html, pageLang);
  html = applyStaticLang(html, pageLang);

  const hero = model.hero;
  [
    ['hero.label', hero.label],
    ['hero.title', hero.title],
    ['hero.lead', hero.lead],
    ['hero.ctaPrimary', hero.ctaPrimary],
    ['hero.ctaSecondary', hero.ctaSecondary],
    ['hero.cardTitle', hero.cardTitle],
    ['hero.cardMeta', hero.cardMeta],
    ['sections.projectsHeadline', model.sections.projectsHeadline],
    ['sections.projectsSub', model.sections.projectsSub],
    ['sections.projectsSubMobile', model.sections.projectsSubMobile],
    ['sections.pricingTitle', model.sections.pricingTitle],
    ['sections.pricingSub', model.sections.pricingSub],
    ['sections.workTitle', model.sections.workTitle],
    ['sections.workBody', model.sections.workBody],
    ['sections.suitTitle', model.sections.suitTitle],
    ['sections.suitBody', model.sections.suitBody],
    ['sections.contactTitle', model.sections.contactTitle],
    ['sections.contactSub', model.sections.contactSub],
    ['sections.reviewTitle', model.sections.reviewTitle],
    ['sections.reviewSub', model.sections.reviewSub],
    ['sections.stripText', model.sections.stripText],
    ['pricing.note', model.pricing.note],
    ['footer.tagline', model.footer.tagline],
    ['footer.copyright', model.footer.copyright],
    ['footer.credit', model.footer.credit],
    ['footer.linksHeading', model.footer.linksHeading],
  ].forEach(([key, value]) => {
    html = fillCms(html, key, value, pageLang);
  });

  if (hero.ctaPrimaryPlan) {
    html = html.replace(/(data-cms="hero\.ctaPrimary"[^>]*\sdata-plan=")[^"]*"/, '$1' + esc(hero.ctaPrimaryPlan) + '"');
  }

  html = fillRaw(html, 'data-cms="stats"', statsHtml(hero.stats, pageLang));
  html = fillRaw(html, 'id="ring"', showcaseHtml(model.showcase, pageLang));
  html = fillRaw(html, 'id="workFeatures"', featuresHtml(model.sections.workFeatures, pageLang));
  html = fillRaw(html, 'id="contactSteps"', stepsHtml(model.sections.contactSteps, pageLang));
  html = fillRaw(html, 'data-cms="pricing"', pricingHtml(model.pricing.plans, pageLang));
  html = fillRaw(html, 'id="footLinks"', footerHtml(model.footer.links, pageLang));
  if (safeReviews.length) {
    html = fillRaw(html, 'id="marquee"', reviewsHtml(safeReviews));
    html = html.replace('class="marquee" id="marquee"', 'class="marquee is-static" id="marquee"');
  }

  if (model.sections.suitImage) {
    const alt = textOf(model.sections.suitTitle, pageLang);
    html = html.replace(
      '<div class="suit-img"><img src="" alt=""></div>',
      `<div class="suit-img"><img src="${esc(model.sections.suitImage)}" alt="${esc(alt)}"${bilingualAttrs(model.sections.suitTitle)}></div>`
    );
  }
  if (hasText(model.sections.suitCta)) {
    html = html.replace(
      '<a class="btn primary plan-cta" href="#contact" data-plan=""></a>',
      `<a class="btn primary plan-cta" href="#contact" data-plan=""${bilingualAttrs(model.sections.suitCta)}>${esc(textOf(model.sections.suitCta, pageLang))}</a>`
    );
  }
  if (model.pricing.plans.length) {
    html = html.replace('</select>', packageOptions(model.pricing.plans) + '</select>');
  }

  const enabled = model.sections.enabled;
  html = setSectionHidden(html, '<section class="work" id="work">', !enabled.work);
  html = setSectionHidden(html, '<section class="suit">', !enabled.suit);
  html = setSectionHidden(html, '<section class="contact" id="contact">', !enabled.contact);
  html = setSectionHidden(html, '<div class="strip" aria-hidden="true">', !enabled.strip);
  html = setSectionHidden(html, '<section class="review" id="review">', !enabled.review);

  const payload = {
    ok: true,
    version: content && content.version,
    content: {
      settings: (content && content.settings) || {},
      showcaseProjects: (content && content.showcaseProjects) || [],
      pricingPlans: (content && content.pricingPlans) || [],
      sections: (content && content.sections) || [],
    },
  };
  const reviewPayload = {
    ok: true,
    reviews: safeReviews.map((review) => ({
      id: review.id,
      name: review.name,
      role: review.role,
      text: review.text,
      rating: review.rating,
      createdAt: review.createdAt,
    })),
  };
  html = html.replace(
    '<script src="/js/footerLinkUtils.js"></script>',
    jsonScript('ij-public-content', payload) + '\n' + jsonScript('ij-public-reviews', reviewPayload) + '\n<script src="/js/footerLinkUtils.js"></script>'
  );
  return html;
}

function renderRobots() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /login',
    'Disallow: /portal',
    'Disallow: /crm',
    'Disallow: /admin',
    '',
    'Sitemap: ' + ORIGIN + '/sitemap.xml',
    '',
  ].join('\n');
}

function renderSitemap() {
  const urls = [ORIGIN + '/', ORIGIN + '/sq'];
  const body = urls.map((loc) => {
    return [
      '  <url>',
      '    <loc>' + loc + '</loc>',
      '    <xhtml:link rel="alternate" hreflang="en" href="' + ORIGIN + '/"/>',
      '    <xhtml:link rel="alternate" hreflang="sq" href="' + ORIGIN + '/sq"/>',
      '    <xhtml:link rel="alternate" hreflang="x-default" href="' + ORIGIN + '/"/>',
      '  </url>',
    ].join('\n');
  }).join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    body,
    '</urlset>',
    '',
  ].join('\n');
}

function renderLlms(content, reviews) {
  const model = normalizePublic(content || {});
  const lines = [
    '# IJ Technology',
    '',
    '> ' + (textOf(model.hero.lead, 'en') || textOf(model.footer.tagline, 'en')),
    '',
    textOf(model.hero.title, 'en'),
    textOf(model.sections.workBody, 'en'),
    '',
    '## Pages',
    '- [English](' + ORIGIN + '/): ' + TITLES.en,
    '- [Albanian](' + ORIGIN + '/sq): ' + TITLES.sq,
    '',
    '## Packages',
  ];
  model.pricing.plans.forEach((plan) => {
    const bits = [planName(plan)];
    const price = planPrice(plan);
    if (price) bits.push(price);
    const detail = textOf(plan.perLabel, 'en');
    if (detail) bits.push(detail.replace(/\s+/g, ' ').trim());
    lines.push('- ' + bits.join(' — '));
  });
  lines.push('', '## Projects');
  model.showcase.forEach((item) => {
    const href = footerLinks.safeHttpUrlForFooter(item.embedUrl || '');
    const title = textOf(item.title, 'en');
    const desc = textOf(item.description, 'en').replace(/\s+/g, ' ').trim();
    lines.push('- ' + (href ? '[' + title + '](' + href + ')' : title) + (desc ? ': ' + desc : ''));
  });
  if (reviews && reviews.length) {
    lines.push('', '## Client reviews');
    reviews.forEach((review) => {
      lines.push('- ' + review.name + (review.role ? ', ' + review.role : '') + ' (' + review.rating + '/5): ' + String(review.text || '').replace(/\s+/g, ' ').trim());
    });
  }
  const email = contactEmail(model.footer);
  if (email) lines.push('', '## Contact', email);
  lines.push('');
  return lines.filter((line) => line != null).join('\n');
}

function renderNotFound() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Page not found — IJ Technology</title>
<link rel="stylesheet" href="/css/styles.css">
</head>
<body>
<main class="container" style="padding:72px 20px;max-width:640px">
<p class="section-label">404</p>
<h1>This page does not exist.</h1>
<p class="lead">Kjo faqe nuk ekziston.</p>
<p><a class="btn primary" href="/">IJ Technology</a> <a class="btn" href="/sq">Shqip</a></p>
</main>
</body>
</html>`;
}

module.exports = {
  ORIGIN,
  templateHtml,
  buildHomeHtml,
  renderRobots,
  renderSitemap,
  renderLlms,
  renderNotFound,
  normalizePublic,
};
