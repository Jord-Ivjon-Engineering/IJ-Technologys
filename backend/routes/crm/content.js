'use strict';

const express = require('express');
const {
  getSiteSettings,
  updateSiteSettings,
  listShowcase,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  listPricing,
  createPricing,
  updatePricing,
  deletePricing,
  listSections,
  createSection,
  updateSection,
  deleteSection,
  touchPublicContentCache,
} = require('../../lib/crmStore');

const router = express.Router();

const SHOWCASE_DESC_MAX = 173;

function showcaseDescriptionFields(description) {
  if (description === undefined) return [];
  const val = description && typeof description === 'object'
    ? { en: description.en || '', sq: description.sq || '' }
    : { en: String(description || ''), sq: String(description || '') };
  const fields = [];
  if (val.en.length > SHOWCASE_DESC_MAX) fields.push('description.en');
  if (val.sq.length > SHOWCASE_DESC_MAX) fields.push('description.sq');
  return fields;
}

router.get('/settings', async (req, res, next) => {
  try {
    const data = await getSiteSettings();
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const settings = req.body?.settings;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ ok: false, error: 'settings object required.' });
    }
    const data = await updateSiteSettings(settings, req.adminUser?.id);
    res.json({ ok: true, ...data, contentVersion: data.updatedAt });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh-cache', async (req, res, next) => {
  try {
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.json({ ok: true, contentVersion });
  } catch (err) {
    next(err);
  }
});

router.get('/showcase', async (req, res, next) => {
  try {
    const items = await listShowcase(true);
    res.json({ ok: true, showcase: items });
  } catch (err) {
    next(err);
  }
});

router.post('/showcase', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title || (typeof body.title !== 'string' && typeof body.title !== 'object')) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields: ['title'] });
    }
    const descFields = showcaseDescriptionFields(body.description);
    if (descFields.length) {
      return res.status(400).json({
        ok: false,
        error: `Description must be ${SHOWCASE_DESC_MAX} characters or fewer per language.`,
        fields: descFields,
      });
    }
    const item = await createShowcase(body, req.adminUser?.id);
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.status(201).json({ ok: true, item, contentVersion });
  } catch (err) {
    next(err);
  }
});

router.patch('/showcase/:id', async (req, res, next) => {
  try {
    const descFields = showcaseDescriptionFields(req.body?.description);
    if (descFields.length) {
      return res.status(400).json({
        ok: false,
        error: `Description must be ${SHOWCASE_DESC_MAX} characters or fewer per language.`,
        fields: descFields,
      });
    }
    const item = await updateShowcase(req.params.id, req.body || {}, req.adminUser?.id);
    if (!item) return res.status(404).json({ ok: false, error: 'Showcase item not found.' });
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.json({ ok: true, item, contentVersion });
  } catch (err) {
    next(err);
  }
});

router.delete('/showcase/:id', async (req, res, next) => {
  try {
    const removed = await deleteShowcase(req.params.id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Showcase item not found.' });
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.json({ ok: true, contentVersion });
  } catch (err) {
    next(err);
  }
});

router.get('/pricing', async (req, res, next) => {
  try {
    const plans = await listPricing(true);
    res.json({ ok: true, plans });
  } catch (err) {
    next(err);
  }
});

router.post('/pricing', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.slug || !body.name) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields: ['slug', 'name'] });
    }
    const plan = await createPricing(body, req.adminUser?.id);
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.status(201).json({ ok: true, plan, contentVersion });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ ok: false, error: 'A plan with this slug already exists.' });
    }
    next(err);
  }
});

router.patch('/pricing/:id', async (req, res, next) => {
  try {
    const plan = await updatePricing(req.params.id, req.body || {}, req.adminUser?.id);
    if (!plan) return res.status(404).json({ ok: false, error: 'Pricing plan not found.' });
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.json({ ok: true, plan, contentVersion });
  } catch (err) {
    next(err);
  }
});

router.delete('/pricing/:id', async (req, res, next) => {
  try {
    const removed = await deletePricing(req.params.id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Pricing plan not found.' });
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.json({ ok: true, contentVersion });
  } catch (err) {
    next(err);
  }
});

router.get('/sections', async (req, res, next) => {
  try {
    const sections = await listSections(true);
    res.json({ ok: true, sections });
  } catch (err) {
    next(err);
  }
});

router.post('/sections', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.slug) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields: ['slug'] });
    }
    const section = await createSection(body, req.adminUser?.id);
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.status(201).json({ ok: true, section, contentVersion });
  } catch (err) {
    next(err);
  }
});

router.patch('/sections/:id', async (req, res, next) => {
  try {
    const section = await updateSection(req.params.id, req.body || {}, req.adminUser?.id);
    if (!section) return res.status(404).json({ ok: false, error: 'Section not found.' });
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.json({ ok: true, section, contentVersion });
  } catch (err) {
    next(err);
  }
});

router.delete('/sections/:id', async (req, res, next) => {
  try {
    const removed = await deleteSection(req.params.id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Section not found.' });
    const contentVersion = await touchPublicContentCache(req.adminUser?.id);
    res.json({ ok: true, contentVersion });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
