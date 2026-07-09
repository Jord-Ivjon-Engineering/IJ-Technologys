'use strict';

/**
 * Tiny append-only JSON stores for contact submissions and client reviews.
 * Good enough for a landing page; swap for a real DB when volume grows.
 */
const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SUBMISSIONS = path.join(DATA_DIR, 'submissions.json');
const REVIEWS = path.join(DATA_DIR, 'reviews.json');

async function readJson(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // no file yet
    throw err;
  }
}

async function appendJson(file, item) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const all = await readJson(file);
  const record = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...item };
  all.push(record);
  await fs.writeFile(file, JSON.stringify(all, null, 2), 'utf8');
  return record;
}

/* contact submissions */
const saveSubmission = (item) => appendJson(SUBMISSIONS, item);
const readAll = () => readJson(SUBMISSIONS);

/* client reviews */
const saveReview = (item) => appendJson(REVIEWS, item);
const readReviews = () => readJson(REVIEWS);

async function updateReview(id, patch) {
  const all = await readJson(REVIEWS);
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...patch };
  await fs.writeFile(REVIEWS, JSON.stringify(all, null, 2), 'utf8');
  return all[idx];
}

async function deleteReview(id) {
  const all = await readJson(REVIEWS);
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  await fs.writeFile(REVIEWS, JSON.stringify(next, null, 2), 'utf8');
  return true;
}

module.exports = { saveSubmission, readAll, saveReview, readReviews, updateReview, deleteReview };
