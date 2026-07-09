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

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

/* ---- middleware ---- */
app.use(express.json({ limit: '16kb' }));

/* ---- API ---- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'ij-technologys', time: new Date().toISOString() });
});
app.use('/api/contact', contactRouter);
app.use('/api/reviews', reviewsRouter);

/* ---- static frontend ---- */
app.use(express.static(FRONTEND_DIR));

/* SPA-style fallback: any non-API route serves index.html */
app.get(/^\/(?!api\/).*/, (req, res) => {
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

app.listen(PORT, () => {
  console.log(`IJ Technologys server running → http://localhost:${PORT}`);
});

module.exports = app;
