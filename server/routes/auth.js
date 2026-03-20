'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { requireParent, requireChild } = require('../middleware/auth');

const router = express.Router();

// GET /api/auth/whoami — return current session info
router.get('/whoami', (req, res) => {
  const db = getDb();

  if (req.session.parentId) {
    const parent = db.prepare('SELECT id, username FROM parents WHERE id = ?').get(req.session.parentId);
    if (!parent) {
      req.session.destroy(() => {});
      return res.json({ type: null });
    }
    const settings = db.prepare('SELECT * FROM settings WHERE parent_id = ?').get(req.session.parentId);
    return res.json({ type: 'parent', parent, settings });
  }

  if (req.session.kidId) {
    const kid = db.prepare('SELECT id, name, avatar_emoji, coins, xp, level, streak FROM kids WHERE id = ? AND is_active = 1').get(req.session.kidId);
    if (!kid) {
      req.session.kidId = null;
      return res.json({ type: null });
    }
    const parentId = db.prepare('SELECT parent_id FROM kids WHERE id = ?').get(req.session.kidId).parent_id;
    const settings = db.prepare('SELECT * FROM settings WHERE parent_id = ?').get(parentId);
    return res.json({ type: 'child', child: kid, settings });
  }

  res.json({ type: null });
});

// POST /api/auth/parent/login
router.post('/parent/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const db = getDb();
    const parent = db.prepare('SELECT * FROM parents WHERE username = ?').get(username);
    if (!parent) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, parent.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.parentId = parent.id;
    req.session.kidId = null;

    const settings = db.prepare('SELECT * FROM settings WHERE parent_id = ?').get(parent.id);
    res.json({ type: 'parent', parent: { id: parent.id, username: parent.username }, settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/parent/logout
router.post('/parent/logout', requireParent, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// POST /api/auth/child/login
router.post('/child/login', (req, res) => {
  const { kid_id, pin } = req.body;
  if (!kid_id || !pin) {
    return res.status(400).json({ error: 'kid_id and pin required' });
  }

  const db = getDb();
  const kid = db.prepare('SELECT * FROM kids WHERE id = ? AND is_active = 1').get(kid_id);
  if (!kid) {
    return res.status(404).json({ error: 'Child not found' });
  }

  if (String(kid.pin) !== String(pin)) {
    return res.status(401).json({ error: 'Incorrect PIN' });
  }

  req.session.kidId = kid.id;
  // Note: parent session is preserved if present (Pi kiosk + phone scenario)

  const parentId = kid.parent_id;
  const settings = db.prepare('SELECT * FROM settings WHERE parent_id = ?').get(parentId);
  res.json({
    type: 'child',
    child: { id: kid.id, name: kid.name, avatar_emoji: kid.avatar_emoji, coins: kid.coins, xp: kid.xp, level: kid.level, streak: kid.streak },
    settings
  });
});

// POST /api/auth/child/logout
router.post('/child/logout', requireChild, (req, res) => {
  req.session.kidId = null;
  res.json({ ok: true });
});

module.exports = router;
