'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { requireChild } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — unread notifications for logged-in child
router.get('/', requireChild, (req, res) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE kid_id = ? AND is_read = 0
    ORDER BY created_at ASC
  `).all(req.session.kidId);

  // Parse payload JSON
  const result = notifications.map(n => ({
    ...n,
    payload: n.payload ? JSON.parse(n.payload) : null
  }));

  res.json(result);
});

// GET /api/notifications/all — all notifications (recent 50)
router.get('/all', requireChild, (req, res) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE kid_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.session.kidId);

  const result = notifications.map(n => ({
    ...n,
    payload: n.payload ? JSON.parse(n.payload) : null
  }));

  res.json(result);
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', requireChild, (req, res) => {
  const db = getDb();
  db.prepare(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND kid_id = ?'
  ).run(req.params.id, req.session.kidId);
  res.json({ ok: true });
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', requireChild, (req, res) => {
  const db = getDb();
  db.prepare(
    'UPDATE notifications SET is_read = 1 WHERE kid_id = ?'
  ).run(req.session.kidId);
  res.json({ ok: true });
});

module.exports = router;
