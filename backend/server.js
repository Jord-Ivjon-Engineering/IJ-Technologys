'use strict';

/**
 * IJ Technology — backend server.
 * Serves the static frontend and exposes a small JSON API
 * (contact form + client reviews, both backed by Supabase).
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');

const contactRouter = require('./routes/contact');
const reviewsRouter = require('./routes/reviews');
const contentRouter = require('./routes/content');
const authRouter = require('./routes/auth');
const crmRouter = require('./routes/crm');
const assistantRouter = require('./routes/assistant');
const { getPublicContent } = require('./lib/crmStore');
const { readPublicReviews } = require('./lib/store');
const {
  templateHtml,
  buildHomeHtml,
  renderRobots,
  renderSitemap,
  renderLlms,
  renderNotFound,
} = require('./lib/publicPage');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const CRM_DIST_DEPLOYED = path.join(FRONTEND_DIR, 'crm');
const CRM_DIST_SOURCE = path.join(__dirname, '..', 'apps', 'crm', 'dist');
const CRM_INDEX_DEPLOYED = path.join(CRM_DIST_DEPLOYED, 'index.html');
const CRM_INDEX_SOURCE = path.join(CRM_DIST_SOURCE, 'index.html');
const CRM_DIST_DIR = fs.existsSync(CRM_INDEX_DEPLOYED) ? CRM_DIST_DEPLOYED : CRM_DIST_SOURCE;
const CRM_INDEX_FILE = fs.existsSync(CRM_INDEX_DEPLOYED) ? CRM_INDEX_DEPLOYED : CRM_INDEX_SOURCE;

/* ---- middleware ---- */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net",
      // Allow showcase cards to embed live projects over https (see 0018 embed_url).
      "frame-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  next();
});
app.use(express.json({ limit: '16kb' }));

/* ---- API ---- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'ij-Technology', time: new Date().toISOString() });
});
app.use('/api/contact', contactRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/content', contentRouter);
app.use('/api/auth', authRouter);
app.use('/api/crm', crmRouter);
app.use('/api/assistant', assistantRouter);

app.get('/admin', (req, res) => {
  res.redirect(302, '/crm/#/reviews');
});

app.get('/admin.html', (req, res) => {
  res.redirect(301, '/admin');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.redirect(301, '/login');
});

app.get('/portal', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'portal.html'));
});

app.get('/portal.html', (req, res) => {
  res.redirect(301, '/portal');
});

app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(renderRobots());
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(renderSitemap());
});

app.get('/llms.txt', async (req, res) => {
  try {
    const published = await loadPublished();
    res.type('text/plain; charset=utf-8').send(renderLlms(published.content, published.reviews));
  } catch (err) {
    console.error(err);
    res.type('text/plain; charset=utf-8').send('# IJ Technology\n\nhttps://www.ij-technology.com/\n');
  }
});

app.get('/', (req, res) => {
  sendHome(res, 'en');
});

app.get('/sq', (req, res) => {
  const pathOnly = req.originalUrl.split('?')[0];
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) {
    return res.redirect(301, '/sq');
  }
  sendHome(res, 'sq');
});

app.use('/crm', express.static(CRM_DIST_DIR));
app.get('/crm/*', (req, res) => {
  res.sendFile(CRM_INDEX_FILE);
});

app.use(express.static(FRONTEND_DIR, { index: false }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'Not found.' });
  }
  res.status(404).set('X-Robots-Tag', 'noindex').type('html').send(renderNotFound());
});

async function loadPublished() {
  const [content, reviews] = await Promise.all([
    getPublicContent(),
    readPublicReviews().catch((err) => {
      console.error(err);
      return [];
    }),
  ]);
  return { content, reviews };
}

function sendHome(res, lang) {
  loadPublished()
    .then((published) => {
      res.set('Cache-Control', 'private, no-cache');
      res.type('html').send(buildHomeHtml(templateHtml(), published.content, published.reviews, lang));
    })
    .catch((err) => {
      console.error(err);
      res.set('Cache-Control', 'private, no-cache');
      res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
    });
}

/* ---- error handler (e.g. malformed JSON) ---- */
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body.' });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: 'Internal server error.' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`IJ Technology server running → http://localhost:${PORT}`);
  });
}

module.exports = app;
