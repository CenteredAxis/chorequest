const cron = require('node-cron');

function startCronJobs(db) {
  // Run daily at midnight to create recurring chore assignments
  cron.schedule('0 0 * * *', () => {
    console.log('Running daily recurring chore job...');

    // Get all recurring chores
    const recurringChores = db.prepare('SELECT * FROM chores WHERE is_recurring = 1').all();

    for (const chore of recurringChores) {
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
