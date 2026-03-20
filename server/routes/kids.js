'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { requireParent } = require('../middleware/auth');

const router = express.Router();

// GET /api/kids — list all active kids
router.get('/', requireParent, (req, res) => {
  const db = getDb();
  const kids = db.prepare(
    'SELECT id, name, avatar_emoji, coins, xp, level, streak, streak_last_date, is_active, created_at FROM kids WHERE parent_id = ? AND is_active = 1 ORDER BY name'
  ).all(req.session.parentId);
  res.json(kids);
});

// GET /api/kids/:id — single kid with badge count
router.get('/:id', requireParent, (req, res) => {
  const db = getDb();
  const kid = db.prepare(
    'SELECT id, name, avatar_emoji, coins, xp, level, streak, streak_last_date, created_at FROM kids WHERE id = ? AND parent_id = ?'
  ).get(req.params.id, req.session.parentId);

  if (!kid) return res.status(404).json({ error: 'Child not found' });

  const badgeCount = db.prepare('SELECT COUNT(*) as cnt FROM kid_badges WHERE kid_id = ?').get(kid.id).cnt;
  const completedCount = db.prepare("SELECT COUNT(*) as cnt FROM chore_instances WHERE kid_id = ? AND status = 'approved'").get(kid.id).cnt;

  res.json({ ...kid, badgeCount, completedCount });
});

// POST /api/kids — create a kid
router.post('/', requireParent, (req, res) => {
  const { name, avatar_emoji, pin } = req.body;

  if (!name || !pin) {
    return res.status(400).json({ error: 'Name and PIN are required' });
  }
  if (String(pin).length !== 4 || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO kids (parent_id, name, avatar_emoji, pin) VALUES (?, ?, ?, ?)'
  ).run(req.session.parentId, name.trim(), avatar_emoji || '🧒', String(pin));

  const kid = db.prepare('SELECT id, name, avatar_emoji, coins, xp, level, streak FROM kids WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(kid);
});

// PUT /api/kids/:id — update kid
router.put('/:id', requireParent, (req, res) => {
  const db = getDb();
  const kid = db.prepare('SELECT id FROM kids WHERE id = ? AND parent_id = ?').get(req.params.id, req.session.parentId);
  if (!kid) return res.status(404).json({ error: 'Child not found' });

  const { name, avatar_emoji, pin } = req.body;

  if (pin !== undefined) {
    if (String(pin).length !== 4 || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }
  }

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
  if (avatar_emoji !== undefined) { updates.push('avatar_emoji = ?'); values.push(avatar_emoji); }
  if (pin !== undefined) { updates.push('pin = ?'); values.push(String(pin)); }

  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  values.push(req.params.id);
  db.prepare(`UPDATE kids SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT id, name, avatar_emoji, coins, xp, level, streak FROM kids WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/kids/:id — soft-delete
router.delete('/:id', requireParent, (req, res) => {
  const db = getDb();
  const kid = db.prepare('SELECT id FROM kids WHERE id = ? AND parent_id = ?').get(req.params.id, req.session.parentId);
  if (!kid) return res.status(404).json({ error: 'Child not found' });

  db.prepare('UPDATE kids SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/kids/:id/badges — kid's earned badges
router.get('/:id/badges', requireParent, (req, res) => {
  const db = getDb();
  const kid = db.prepare('SELECT id FROM kids WHERE id = ? AND parent_id = ?').get(req.params.id, req.session.parentId);
  if (!kid) return res.status(404).json({ error: 'Child not found' });

  const badges = db.prepare(`
    SELECT b.*, kb.earned_at
    FROM kid_badges kb
    JOIN badges b ON b.id = kb.badge_id
    WHERE kb.kid_id = ?
    ORDER BY kb.earned_at DESC
  `).all(req.params.id);

  res.json(badges);
});

// GET /api/kids/all/list — public list for kiosk avatar selector (no parent auth needed)
router.get('/all/list', (req, res) => {
  // Find parent_id — for simplicity, return all active kids across all parents
  // In a single-family setup this is fine
  const db = getDb();
  const kids = db.prepare(
    'SELECT id, name, avatar_emoji, level FROM kids WHERE is_active = 1 ORDER BY name'
  ).all();
  res.json(kids);
});

module.exports = router;
