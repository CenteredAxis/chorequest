function checkAndAwardBadges(db, kidId) {
  const newBadgeSlugs = [];

  // Get all badges
  const allBadges = db.prepare('SELECT id, slug FROM badges').all();
  const badgeMap = {};
  allBadges.forEach((b) => {
    badgeMap[b.slug] = b.id;
  });

  // Get kid's already earned badges
  const earnedBadges = db
    .prepare('SELECT badge_id FROM kid_badges WHERE kid_id = ?')
    .all(kidId);
  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badge_id));

  // Get kid stats
  const kid = db.prepare('SELECT level, coins, streak FROM kids WHERE id = ?').get(kidId);

  const approvedCount = db
    .prepare('SELECT COUNT(*) as count FROM completions WHERE kid_id = ? AND status = ?')
    .get(kidId, 'approved').count;

  const coinsEarned = db
    .prepare(
      `SELECT COALESCE(SUM(c.coin_reward), 0) as total FROM completions comp
       JOIN chores c ON comp.chore_id = c.id
       WHERE comp.kid_id = ? AND comp.status = ?`
    )
    .get(kidId, 'approved').total;

  const doTogetherCount = db
    .prepare(
      `SELECT COUNT(*) as count FROM completions
       WHERE kid_id = ? AND status = ? AND do_together_group_id IS NOT NULL`
    )
    .get(kidId, 'approved').count;

  const redemptionCount = db
    .prepare('SELECT COUNT(*) as count FROM redemptions WHERE kid_id = ?')
    .get(kidId).count;

  // Check each badge condition
  const badgeConditions = {
    first_chore: approvedCount >= 1,
    chore_5: approvedCount >= 5,
    chore_25: approvedCount >= 25,
    chore_100: approvedCount >= 100,
    streak_3: kid.streak >= 3,
    streak_7: kid.streak >= 7,
    streak_30: kid.streak >= 30,
    coins_100: coinsEarned >= 100,
    coins_500: coinsEarned >= 500,
    do_together_5: doTogetherCount >= 5,
    level_5: kid.level >= 5,
    level_10: kid.level >= 10,
    first_redemption: redemptionCount >= 1
  };

  // Award badges
  const insertStmt = db.prepare(
    'INSERT INTO kid_badges (kid_id, badge_id) VALUES (?, ?)'
  );

  for (const [slug, condition] of Object.entries(badgeConditions)) {
    if (condition) {
      const badgeId = badgeMap[slug];
      if (badgeId && !earnedBadgeIds.has(badgeId)) {
        insertStmt.run(kidId, badgeId);
        newBadgeSlugs.push(slug);
      }
    }
  }

  return newBadgeSlugs;
}

module.exports = { checkAndAwardBadges };
