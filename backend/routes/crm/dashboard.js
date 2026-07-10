'use strict';

const express = require('express');
const { getDashboardPage } = require('../../lib/crmStore');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { stats, recentSubmissions, dueSoon } = await getDashboardPage();
    const revenue = Number(stats.totalRevenue || 0);
    const cost = Number(stats.totalCost || 0);
    res.json({
      ok: true,
      dashboard: {
        ...stats,
        margin: revenue - cost,
        dueSoonCount: dueSoon.count,
      },
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        status: s.status,
        createdAt: s.receivedAt,
      })),
      projectsDueSoon: dueSoon.items,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
