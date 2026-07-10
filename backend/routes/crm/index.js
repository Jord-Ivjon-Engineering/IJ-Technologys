'use strict';

const express = require('express');
const { requireAdmin } = require('../../middleware/requireAdmin');

const dashboardRouter = require('./dashboard');
const clientsRouter = require('./clients');
const projectsRouter = require('./projects');
const submissionsRouter = require('./submissions');
const reviewsRouter = require('./reviews');
const costsRouter = require('./costs');
const financeRouter = require('./finance');
const contentRouter = require('./content');
const mediaRouter = require('./media');
const teamRouter = require('./team');

const router = express.Router();

router.use(requireAdmin);

router.use('/dashboard', dashboardRouter);
router.use('/clients', clientsRouter);
router.use('/projects', projectsRouter);
router.use('/submissions', submissionsRouter);
router.use('/reviews', reviewsRouter);
router.use('/costs', costsRouter);
router.use('/finance', financeRouter);
router.use('/content', contentRouter);
router.use('/media', mediaRouter);
router.use('/team', teamRouter);

module.exports = router;
