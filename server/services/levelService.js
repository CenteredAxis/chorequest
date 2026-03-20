function xpForLevel(n) {
  return Math.floor(100 * Math.pow(n, 1.5));
}

function levelFromXP(xp) {
  let level = 1;
  let totalXpNeeded = 0;

  while (true) {
    const nextLevelXp = xpForLevel(level + 1);
    if (totalXpNeeded + nextLevelXp > xp) {
      break;
    }
    totalXpNeeded += nextLevelXp;
    level++;
  }

  return level;
}

function applyXP(db, kidId, xpGained) {
  const kid = db.prepare('SELECT xp, level FROM kids WHERE id = ?').get(kidId);

  const newXP = kid.xp + xpGained;
  const newLevel = levelFromXP(newXP);
  const leveledUp = newLevel > kid.level;

  db.prepare('UPDATE kids SET xp = ?, level = ? WHERE id = ?').run(
    newXP,
    newLevel,
    kidId
  );

  return { newXP, newLevel, leveledUp };
}

module.exports = { xpForLevel, levelFromXP, applyXP };
