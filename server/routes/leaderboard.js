'use strict';

const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/leaderboard — kids ranked by coins, with streaks
router.get('/', (req, res) => {
  const db = getDb();

  const kids = db.prepare(`
    SELECT
      k.id,
      k.name,
      k.avatar_emoji,
      k.coins,
      k.xp,
      k.level,
      k.streak,
      COUNT(kb.badge_id) as badge_count,
      (SELECT COUNT(*) FROM completions WHERE kid_id = k.id AND status = 'approved') as chores_done
    FROM kids k
    LEFT JOIN kid_badges kb ON kb.kid_id = k.id
    WHERE k.is_active = 1
    GROUP BY k.id
    ORDER BY k.coins DESC, k.level DESC, k.streak DESC
  `).all();

  res.json(kids);
});

module.exports = router;
