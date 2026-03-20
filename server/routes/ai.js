'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { requireChild, requireParent } = require('../middleware/auth');
const { getNarrativesForChores, suggestChores } = require('../services/aiService');

const router = express.Router();

// GET /api/ai/narratives?choreIds=1,2,3
router.get('/narratives', requireChild, async (req, res) => {
  try {
    const ids = (req.query.choreIds || '').split(',').map(Number).filter(Boolean);
    if (ids.length === 0) return res.json({ narratives: {} });

    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');
    const chores = db.prepare(`SELECT id, title, description FROM chores WHERE id IN (${placeholders})`).all(...ids);

    const narratives = await getNarrativesForChores(db, chores);
    res.json({ narratives });
  } catch (err) {
    console.error('Narrative generation error:', err.message);
    res.json({ narratives: {} });
  }
});

// POST /api/ai/suggest-chores
router.post('/suggest-chores', requireParent, async (req, res) => {
  try {
    const db = getDb();
    const suggestions = await suggestChores(db, req.session.parentId);
    res.json({ suggestions });
  } catch (err) {
    console.error('Chore suggestion error:', err.message);
    res.status(500).json({ error: 'Failed to generate suggestions. Is the AI server running?' });
  }
});

module.exports = router;
