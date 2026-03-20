'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { requireParent, requireChild } = require('../middleware/auth');
const { checkAndAwardBadges } = require('../services/badgeService');

const router = express.Router();

// ─── SHOP ITEMS ───────────────────────────────────────────────────────────────

// GET /api/shop — list all active shop items
router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare(
    'SELECT * FROM shop_items WHERE is_active = 1 ORDER BY coin_cost ASC, title ASC'
  ).all();
  res.json(items);
});

// POST /api/shop — create a shop item (parent only)
router.post('/', requireParent, (req, res) => {
  const { title, description, category, coin_cost, icon_emoji, stock } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const validCategories = ['physical', 'privilege', 'experience'];
  if (category && !validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO shop_items (parent_id, title, description, category, coin_cost, icon_emoji, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.session.parentId,
    title.trim(),
    description || null,
    category || 'physical',
    Number(coin_cost) || 10,
    icon_emoji || '🎁',
    stock != null ? Number(stock) : null
  );

  const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

// PUT /api/shop/:id — update shop item (parent only)
router.put('/:id', requireParent, (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND parent_id = ?').get(req.params.id, req.session.parentId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const { title, description, category, coin_cost, icon_emoji, stock, is_active } = req.body;

  const updates = [];
  const values = [];

  if (title !== undefined) { updates.push('title = ?'); values.push(title.trim()); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (category !== undefined) { updates.push('category = ?'); values.push(category); }
  if (coin_cost !== undefined) { updates.push('coin_cost = ?'); values.push(Number(coin_cost)); }
  if (icon_emoji !== undefined) { updates.push('icon_emoji = ?'); values.push(icon_emoji); }
  if (stock !== undefined) { updates.push('stock = ?'); values.push(stock === null ? null : Number(stock)); }
  if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

  if (updates.length > 0) {
    values.push(req.params.id);
    db.prepare(`UPDATE shop_items SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/shop/:id — soft-delete (parent only)
router.delete('/:id', requireParent, (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND parent_id = ?').get(req.params.id, req.session.parentId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  db.prepare('UPDATE shop_items SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/shop/:id/redeem — child buys an item
router.post('/:id/redeem', requireChild, (req, res) => {
  const db = getDb();

  const redeemTransaction = db.transaction(() => {
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!item) throw Object.assign(new Error('Item not found or unavailable'), { status: 404 });

    // Check stock
    if (item.stock !== null && item.stock <= 0) {
      throw Object.assign(new Error('This item is out of stock'), { status: 400 });
    }

    const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(req.session.kidId);
    if (!kid) throw Object.assign(new Error('Child not found'), { status: 404 });

    if (kid.coins < item.coin_cost) {
      throw Object.assign(new Error(`Not enough coins. You need ${item.coin_cost - kid.coins} more.`), { status: 400 });
    }

    // Deduct coins
    db.prepare('UPDATE kids SET coins = coins - ? WHERE id = ?').run(item.coin_cost, req.session.kidId);

    // Decrement stock if limited
    if (item.stock !== null) {
      db.prepare('UPDATE shop_items SET stock = stock - 1 WHERE id = ?').run(item.id);
    }

    // Create redemption record
    const result = db.prepare(`
      INSERT INTO redemptions (kid_id, shop_item_id, coins_spent, status)
      VALUES (?, ?, ?, 'pending')
    `).run(req.session.kidId, item.id, item.coin_cost);

    // Check for first redemption badge
    checkAndAwardBadges(req.session.kidId);

    const redemption = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(result.lastInsertRowid);
    const updatedKid = db.prepare('SELECT coins FROM kids WHERE id = ?').get(req.session.kidId);

    return { redemption, newBalance: updatedKid.coins };
  });

  try {
    const result = redeemTransaction();
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── REDEMPTIONS ──────────────────────────────────────────────────────────────

// GET /api/redemptions — all redemptions (parent)
router.get('/redemptions', requireParent, (req, res) => {
  const db = getDb();
  const { status } = req.query;

  let query = `
    SELECT r.*, k.name as kid_name, k.avatar_emoji as kid_avatar,
           s.title as item_title, s.icon_emoji as item_emoji, s.category
    FROM redemptions r
    JOIN kids k ON k.id = r.kid_id
    JOIN shop_items s ON s.id = r.shop_item_id
    WHERE s.parent_id = ?
  `;
  const params = [req.session.parentId];

  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.requested_at DESC';

  const redemptions = db.prepare(query).all(...params);
  res.json(redemptions);
});

// GET /api/redemptions/mine — child's own redemption history
router.get('/redemptions/mine', requireChild, (req, res) => {
  const db = getDb();
  const redemptions = db.prepare(`
    SELECT r.*, s.title as item_title, s.icon_emoji as item_emoji, s.category
    FROM redemptions r
    JOIN shop_items s ON s.id = r.shop_item_id
    WHERE r.kid_id = ?
    ORDER BY r.requested_at DESC
  `).all(req.session.kidId);
  res.json(redemptions);
});

// POST /api/redemptions/:id/fulfill — parent marks fulfilled
router.post('/redemptions/:id/fulfill', requireParent, (req, res) => {
  const db = getDb();
  const { note } = req.body;

  const redemption = db.prepare(`
    SELECT r.* FROM redemptions r
    JOIN shop_items s ON s.id = r.shop_item_id
    WHERE r.id = ? AND s.parent_id = ? AND r.status = 'pending'
  `).get(req.params.id, req.session.parentId);

  if (!redemption) return res.status(404).json({ error: 'Redemption not found' });

  db.prepare(`
    UPDATE redemptions SET status = 'fulfilled', fulfilled_at = datetime('now'), parent_note = ? WHERE id = ?
  `).run(note || null, req.params.id);

  // Notify the kid
  const item = db.prepare('SELECT title, icon_emoji FROM shop_items WHERE id = ?').get(redemption.shop_item_id);
  db.prepare(`
    INSERT INTO notifications (kid_id, type, message, payload)
    VALUES (?, 'approved', ?, ?)
  `).run(
    redemption.kid_id,
    `Your reward "${item.title}" has been granted! ${item.icon_emoji} Enjoy!`,
    JSON.stringify({ item_title: item.title, item_emoji: item.icon_emoji, note: note || null })
  );

  const updated = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// POST /api/redemptions/:id/cancel — parent cancels + refunds coins
router.post('/redemptions/:id/cancel', requireParent, (req, res) => {
  const db = getDb();
  const { note } = req.body;

  const redemption = db.prepare(`
    SELECT r.* FROM redemptions r
    JOIN shop_items s ON s.id = r.shop_item_id
    WHERE r.id = ? AND s.parent_id = ? AND r.status = 'pending'
  `).get(req.params.id, req.session.parentId);

  if (!redemption) return res.status(404).json({ error: 'Redemption not found' });

  const cancelTransaction = db.transaction(() => {
    db.prepare(`
      UPDATE redemptions SET status = 'cancelled', parent_note = ? WHERE id = ?
    `).run(note || null, req.params.id);

    // Refund coins
    db.prepare('UPDATE kids SET coins = coins + ? WHERE id = ?').run(redemption.coins_spent, redemption.kid_id);

    // Restore stock if item had limited stock
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(redemption.shop_item_id);
    if (item && item.stock !== null) {
      db.prepare('UPDATE shop_items SET stock = stock + 1 WHERE id = ?').run(item.id);
    }

    // Notify kid
    db.prepare(`
      INSERT INTO notifications (kid_id, type, message, payload)
      VALUES (?, 'rejected', ?, ?)
    `).run(
      redemption.kid_id,
      `Your reward request was cancelled. ${redemption.coins_spent} coins have been refunded. ${note ? note : ''}`,
      JSON.stringify({ refunded: redemption.coins_spent, note: note || null })
    );
  });

  cancelTransaction();

  const updated = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
