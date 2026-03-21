const cron = require('node-cron');

function shouldRunToday(cronSchedule) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat

  if (!cronSchedule || cronSchedule === 'daily') {
    return true;
  }

  if (cronSchedule === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (cronSchedule === 'weekends') {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  // weekly:0,3,5 — comma-separated day numbers (0=Sun)
  if (cronSchedule.startsWith('weekly:')) {
    const days = cronSchedule.replace('weekly:', '').split(',').map(Number);
    return days.includes(dayOfWeek);
  }

  // Legacy cron expressions — just run daily as fallback
  return true;
}

function startCronJobs(db) {
  // Run daily at midnight to create recurring chore assignments
  cron.schedule('0 0 * * *', () => {
    console.log('Running daily recurring chore job...');

    // Get all recurring chores
    const recurringChores = db.prepare('SELECT * FROM chores WHERE is_recurring = 1').all();

    for (const chore of recurringChores) {
      if (!shouldRunToday(chore.cron_schedule)) {
        continue;
      }

      if (chore.is_open) {
        // Open chores: create one assignment per day
        db.prepare('INSERT INTO chore_assignments (chore_id, kid_id) VALUES (?, NULL)').run(
          chore.id
        );
      } else {
        // Get all kids assigned to this chore
        const assignments = db
          .prepare(
            'SELECT DISTINCT kid_id FROM chore_assignments WHERE chore_id = ? AND kid_id IS NOT NULL'
          )
          .all(chore.id);

        for (const assignment of assignments) {
          db.prepare('INSERT INTO chore_assignments (chore_id, kid_id) VALUES (?, ?)').run(
            chore.id,
            assignment.kid_id
          );
        }
      }
    }

    console.log('Daily recurring chore job completed');
  });
}

module.exports = { startCronJobs };
