'use strict';

/**
 * IJ Technologys — backend server.
 * Serves the static frontend and exposes a small JSON API
 * (contact form + client reviews, both backed by Supabase).
 */
require('dotenv').config();

const path = require('path');
const express = require('express');

const contactRouter = require('./routes/contact');
const reviewsRouter = require('./routes/reviews');
const contentRouter = require('./routes/content');
const authRouter = require('./routes/auth');
const crmRouter = require('./routes/crm');
const assistantRouter = require('./routes/assistant');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const CRM_DIST_DIR = path.join(__dirname, '..', 'apps', 'crm', 'dist');

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
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
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
  res.json({ ok: true, service: 'ij-technologys', time: new Date().toISOString() });
});
app.use('/api/contact', contactRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/content', contentRouter);
app.use('/api/auth', authRouter);
app.use('/api/crm', crmRouter);
app.use('/api/assistant', assistantRouter);

app.get('/admin.html', (req, res) => {
  res.redirect(302, '/crm/#/reviews');
});

app.get('/login', (req, res) => {
  res.redirect(302, '/login.html');
});

app.get('/portal', (req, res) => {
  res.redirect(302, '/portal.html');
});

app.use('/crm', express.static(CRM_DIST_DIR));
app.get('/crm/*', (req, res) => {
  res.sendFile(path.join(CRM_DIST_DIR, 'index.html'));
});

app.use(express.static(FRONTEND_DIR));

app.get(/^\/(?!api\/|crm\/|login\.html|portal\.html|login|portal).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

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
    console.log(`IJ Technologys server running → http://localhost:${PORT}`);
  });
}

module.exports = app;
