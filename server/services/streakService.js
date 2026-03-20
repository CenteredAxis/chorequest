const { DateTime } = require('luxon');

function updateStreak(db, kidId, timezone) {
  const kid = db.prepare('SELECT streak, streak_last_date FROM kids WHERE id = ?').get(kidId);

  // Get today's date in the specified timezone
  const todayDate = DateTime.now()
    .setZone(timezone)
    .toISODate();

  const lastDate = kid.streak_last_date;

  // Check if kid completed any chore today
  const todayCompletion = db
    .prepare(
      `SELECT COUNT(*) as count FROM completions
       WHERE kid_id = ? AND status = 'approved'
       AND DATE(submitted_at, 'localtime') = ?`
    )
    .get(kidId, todayDate);

  if (todayCompletion.count === 0) {
    return { streak: kid.streak, updated: false };
  }

  // If streak_last_date is today, don't increment (already counted)
  if (lastDate === todayDate) {
    return { streak: kid.streak, updated: false };
  }

  // Check if last completion was yesterday
  const yesterdayDate = DateTime.now()
    .setZone(timezone)
    .minus({ days: 1 })
    .toISODate();

  let newStreak = kid.streak;

  if (lastDate === yesterdayDate) {
    // Continue streak
    newStreak = kid.streak + 1;
  } else {
    // Start new streak
    newStreak = 1;
  }

  db.prepare('UPDATE kids SET streak = ?, streak_last_date = ? WHERE id = ?').run(
    newStreak,
    todayDate,
    kidId
  );

  return { streak: newStreak, updated: true };
}

module.exports = { updateStreak };
