'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { requireParent } = require('../middleware/auth');
const { applyXP } = require('../services/levelService');
const { updateStreak } = require('../services/streakService');
const { checkAndAwardBadges } = require('../services/badgeService');

const router = express.Router();

// POST /api/completions/:id/approve
router.post('/:id/approve', requireParent, (req, res) => {
  const db = getDb();
  const settings = db
    .prepare('SELECT timezone FROM settings WHERE parent_id = ?')
    .get(req.session.parentId);
  const timezone = settings?.timezone || 'UTC';

  try {
    const completion = db
      .prepare('SELECT chore_id, kid_id, is_bonus FROM completions WHERE id = ?')
      .get(req.params.id);

    if (!completion) {
      return res.status(404).json({ error: 'Completion not found' });
    }

    const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(completion.chore_id);

    // Award coins and XP (bonus quests get 1.5x coins)
    const coinReward = completion.is_bonus
      ? Math.floor(chore.coin_reward * 1.5)
      : chore.coin_reward;
    db.prepare('UPDATE kids SET coins = coins + ? WHERE id = ?').run(
      coinReward,
      completion.kid_id
    );

    const { newLevel, leveledUp } = applyXP(db, completion.kid_id, chore.xp_reward);

    // Update completion status
    db.prepare('UPDATE completions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      'approved',
      req.params.id
    );

    // Update streak
    const streakResult = updateStreak(db, completion.kid_id, timezone);

    // Check for badges
    const newBadges = checkAndAwardBadges(db, completion.kid_id);

    res.json({
      message: 'Completion approved',
      leveledUp,
      newLevel,
      streak: streakResult.streak,
      newBadges,
      coinReward
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/completions/:id/reject
router.post('/:id/reject', requireParent, (req, res) => {
  const db = getDb();

  try {
    db.prepare('UPDATE completions SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      'rejected',
      req.params.id
    );

    res.json({ message: 'Completion rejected' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/completions/pending
router.get('/pending', requireParent, (req, res) => {
  const db = getDb();

  const pending = db
    .prepare(
      `SELECT comp.*, c.title as chore_title, c.coin_reward, c.xp_reward, c.parent_id,
              k.name as kid_name, k.avatar_emoji
       FROM completions comp
       JOIN chores c ON comp.chore_id = c.id
       JOIN kids k ON comp.kid_id = k.id
       WHERE c.parent_id = ? AND comp.status = 'pending'
       ORDER BY comp.submitted_at DESC`
    )
    .all(req.session.parentId);

  res.json(pending);
});

module.exports = router;
