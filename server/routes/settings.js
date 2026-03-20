const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { requireParent } = require('../middleware/auth');

// GET /api/settings - get settings for parent
router.get('/', requireParent, (req, res) => {
  const db = getDb();
  const settings = db
    .prepare('SELECT * FROM settings WHERE parent_id = ?')
    .get(req.session.parentId);

  if (!settings) {
    return res.status(404).json({ error: 'Settings not found' });
  }

  res.json(settings);
});

// PUT /api/settings - update settings
router.put('/', requireParent, (req, res) => {
  const { household_name, timezone, coin_label, screensaver_timeout, sounds_enabled } = req.body;
  const db = getDb();

  try {
    db.prepare(
      'UPDATE settings SET household_name = ?, timezone = ?, coin_label = ?, screensaver_timeout = ?, sounds_enabled = ? WHERE parent_id = ?'
    ).run(
      household_name || 'My Household',
      timezone || 'UTC',
      coin_label || 'Gold Coins',
      screensaver_timeout || 300,
      sounds_enabled !== undefined ? (sounds_enabled ? 1 : 0) : 1,
      req.session.parentId
    );

    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
