'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { requireChild, requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/badges — full catalog
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const badges = db.prepare('SELECT * FROM badges ORDER BY trigger_type, trigger_value').all();
  res.json(badges);
});

// GET /api/badges/mine — logged-in child's earned badges
router.get('/mine', requireChild, (req, res) => {
  const db = getDb();
  const badges = db.prepare(`
    SELECT b.*, kb.earned_at
    FROM kid_badges kb
    JOIN badges b ON b.id = kb.badge_id
    WHERE kb.kid_id = ?
    ORDER BY kb.earned_at DESC
  `).all(req.session.kidId);
  res.json(badges);
});

module.exports = router;
