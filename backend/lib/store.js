'use strict';

/**
 * Tiny append-only JSON store for contact submissions.
 * Good enough for a landing page; swap for a real DB when volume grows.
 */
const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'submissions.json');

async function readAll() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return []; // no file yet
    throw err;
  }
}

async function saveSubmission(submission) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const all = await readAll();
  all.push({ id: Date.now().toString(36), ...submission });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2), 'utf8');
  return submission;
}

module.exports = { saveSubmission, readAll };
