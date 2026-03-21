const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { requireParent, requireChild } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { applyXP } = require('../services/levelService');
const { updateStreak } = require('../services/streakService');
const { checkAndAwardBadges } = require('../services/badgeService');

// GET /api/chores - list chores for parent (with assigned kids)
router.get('/', requireParent, (req, res) => {
  const db = getDb();
  const chores = db
    .prepare('SELECT * FROM chores WHERE parent_id = ? ORDER BY created_at DESC')
    .all(req.session.parentId);

  // Attach assigned kids to each chore
  const assignStmt = db.prepare(
    `SELECT DISTINCT k.id, k.name, k.avatar_emoji
     FROM chore_assignments ca
     JOIN kids k ON ca.kid_id = k.id
     WHERE ca.chore_id = ?`
  );
  for (const chore of chores) {
    chore.assigned_kids = assignStmt.all(chore.id);
  }

  res.json(chores);
});

// Helper: convert friendly recurrence fields to cron_schedule string
function buildScheduleString(recurrence_freq, recurrence_days) {
  if (!recurrence_freq) return null;
  if (recurrence_freq === 'weekly' && Array.isArray(recurrence_days) && recurrence_days.length > 0) {
    return `weekly:${recurrence_days.join(',')}`;
  }
  return recurrence_freq; // 'daily', 'weekdays', 'weekends'
}

// POST /api/chores - create chore
router.post('/', requireParent, (req, res) => {
  const { title, description, coin_reward, xp_reward, is_recurring, recurrence_freq, recurrence_days, cron_schedule, is_open, do_together, do_together_bonus, require_photo, kids } = req.body;
  const db = getDb();

  const schedule = is_recurring ? (buildScheduleString(recurrence_freq, recurrence_days) || cron_schedule || 'daily') : null;

  try {
    const stmt = db.prepare(
      'INSERT INTO chores (parent_id, title, description, coin_reward, xp_reward, is_recurring, cron_schedule, is_open, do_together, do_together_bonus, require_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      req.session.parentId,
      title,
      description || null,
      coin_reward || 10,
      xp_reward || 50,
      is_recurring ? 1 : 0,
      schedule,
      is_open ? 1 : 0,
      do_together ? 1 : 0,
      do_together_bonus || 5,
      require_photo ? 1 : 0
    );

    const choreId = result.lastInsertRowid;

    // Create assignments for selected kids
    if (kids && Array.isArray(kids)) {
      const assignStmt = db.prepare('INSERT INTO chore_assignments (chore_id, kid_id) VALUES (?, ?)');
      for (const kidId of kids) {
        assignStmt.run(choreId, kidId);
      }
    }

    res.status(201).json({ id: choreId, message: 'Chore created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/chores/:id - update chore
router.put('/:id', requireParent, (req, res) => {
  const { title, description, coin_reward, xp_reward, is_recurring, recurrence_freq, recurrence_days, cron_schedule, is_open, do_together, do_together_bonus, require_photo, kids } = req.body;
  const db = getDb();

  const schedule = is_recurring ? (buildScheduleString(recurrence_freq, recurrence_days) || cron_schedule || 'daily') : null;

  try {
    db.prepare(
      'UPDATE chores SET title = ?, description = ?, coin_reward = ?, xp_reward = ?, is_recurring = ?, cron_schedule = ?, is_open = ?, do_together = ?, do_together_bonus = ?, require_photo = ? WHERE id = ? AND parent_id = ?'
    ).run(
      title,
      description || null,
      coin_reward || 10,
      xp_reward || 50,
      is_recurring ? 1 : 0,
      schedule,
      is_open ? 1 : 0,
      do_together ? 1 : 0,
      do_together_bonus || 5,
      require_photo ? 1 : 0,
      req.params.id,
      req.session.parentId
    );

    // Update assignments if provided
    if (kids && Array.isArray(kids)) {
      db.prepare('DELETE FROM chore_assignments WHERE chore_id = ?').run(req.params.id);
      const assignStmt = db.prepare('INSERT INTO chore_assignments (chore_id, kid_id) VALUES (?, ?)');
      for (const kidId of kids) {
        assignStmt.run(req.params.id, kidId);
      }
    }

    // Invalidate cached AI narrative
    db.prepare('DELETE FROM chore_narratives WHERE chore_id = ?').run(req.params.id);

    res.json({ message: 'Chore updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/chores/:id - delete chore
router.delete('/:id', requireParent, (req, res) => {
  const db = getDb();

  try {
    db.prepare('DELETE FROM chore_assignments WHERE chore_id = ?').run(req.params.id);
    db.prepare('DELETE FROM completions WHERE chore_id = ?').run(req.params.id);
    db.prepare('DELETE FROM chore_narratives WHERE chore_id = ?').run(req.params.id);
    db.prepare('DELETE FROM chores WHERE id = ? AND parent_id = ?').run(
      req.params.id,
      req.session.parentId
    );

    res.json({ message: 'Chore deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/chores/kid - list chores for current kid
router.get('/kid', requireChild, (req, res) => {
  const db = getDb();

  const assignedChores = db
    .prepare(
      'SELECT DISTINCT c.* FROM chores c JOIN chore_assignments ca ON c.id = ca.chore_id WHERE ca.kid_id = ?'
    )
    .all(req.session.kidId);

  const openChores = db.prepare('SELECT * FROM chores WHERE is_open = 1').all();

  const allChores = [...assignedChores, ...openChores].filter(
    (chore, index, self) => self.findIndex((c) => c.id === chore.id) === index
  );

  res.json(allChores);
});

// POST /api/chores/:id/submit - kid submits completion
router.post('/:id/submit', requireChild, upload.single('photo'), (req, res) => {
  const { notes } = req.body;
  const db = getDb();

  try {
    const stmt = db.prepare(
      'INSERT INTO completions (chore_id, kid_id, status, notes, photo_path) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      req.params.id,
      req.session.kidId,
      'pending',
      notes || null,
      req.file ? req.file.path : null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Submission created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/completions/:id/approve - parent approves
router.post('/completions/:id/approve', requireParent, (req, res) => {
  const db = getDb();
  const settings = db
    .prepare('SELECT timezone FROM settings WHERE parent_id = ?')
    .get(req.session.parentId);
  const timezone = settings?.timezone || 'UTC';

  try {
    const completion = db
      .prepare('SELECT chore_id, kid_id FROM completions WHERE id = ?')
      .get(req.params.id);

    if (!completion) {
      return res.status(404).json({ error: 'Completion not found' });
    }

    const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(completion.chore_id);

    // Award coins and XP
    db.prepare('UPDATE kids SET coins = coins + ? WHERE id = ?').run(
      chore.coin_reward,
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
      newBadges
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/completions/:id/reject - parent rejects
router.post('/completions/:id/reject', requireParent, (req, res) => {
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

// GET /api/completions/pending - parent sees pending completions
router.get('/completions/pending', requireParent, (req, res) => {
  const db = getDb();

  const pending = db
    .prepare(
      `SELECT comp.*, c.title as chore_title, c.parent_id, k.name as kid_name, k.avatar_emoji
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
