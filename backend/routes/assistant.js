'use strict';

/**
 * POST /api/assistant
 * Body: { messages: [{ role:'user'|'assistant', content:string }, ...] }
 * The last message must be the visitor's newest question.
 *
 * Returns { ok:true, reply } on success. On any upstream/config problem it
 * still returns 200 with a friendly bilingual fallback reply so the chat UI
 * never shows a raw error.
 */
const express = require('express');
const { askAssistant, MAX_CHARS } = require('../lib/assistant');

const router = express.Router();

const MAX_MESSAGES = 24;

function sanitize(body) {
  const raw = Array.isArray(body && body.messages) ? body.messages : null;
  if (!raw) return null;

  const messages = raw
    .filter((m) => m && typeof m.content === 'string')
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.trim().slice(0, MAX_CHARS),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_MESSAGES);

  if (!messages.length) return null;
  // The conversation must end with a user turn.
  if (messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

router.post('/', async (req, res, next) => {
  try {
    const messages = sanitize(req.body || {});
    if (!messages) {
      return res.status(400).json({ ok: false, error: 'A user message is required.' });
    }

    const result = await askAssistant(messages);
    // Always 200: `reply` is safe to display in both success and fallback cases.
    return res.json({ ok: result.ok, reply: result.reply });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
