// Mirror of server/services/levelService.js
// Keep in sync with the server formula.

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function levelFromXP(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function xpProgress(xp) {
  const level = levelFromXP(xp);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const current = xp - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  return {
    level,
    current,
    needed,
    pct: needed > 0 ? Math.min(1, current / needed) : 1,
    totalXP: xp
  };
}
