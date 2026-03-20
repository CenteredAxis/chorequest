const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

function seed() {
  const db = getDb();

  // Check if already seeded
  const parentCount = db.prepare('SELECT COUNT(*) as count FROM parents').get().count;
  if (parentCount > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Create default parent
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const parentStmt = db.prepare(
    'INSERT INTO parents (username, password) VALUES (?, ?)'
  );
  const parentResult = parentStmt.run('admin', hashedPassword);
  const parentId = parentResult.lastInsertRowid;

  // Create settings for parent
  const settingsStmt = db.prepare(
    'INSERT INTO settings (parent_id, household_name, timezone, coin_label, screensaver_timeout, sounds_enabled) VALUES (?, ?, ?, ?, ?, ?)'
  );
  settingsStmt.run(parentId, 'My Household', 'UTC', 'Gold Coins', 300, 1);

  // Create demo kids
  const kidsStmt = db.prepare(
    'INSERT INTO kids (parent_id, name, avatar_emoji, pin, coins, xp, level, streak) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const emmaResult = kidsStmt.run(parentId, 'Emma', '🌟', '1234', 45, 250, 1, 0);
  const jakeResult = kidsStmt.run(parentId, 'Jake', '🚀', '5678', 12, 100, 1, 0);
  const emmaId = emmaResult.lastInsertRowid;
  const jakeId = jakeResult.lastInsertRowid;

  // Create sample chores
  const choresStmt = db.prepare(
    'INSERT INTO chores (parent_id, title, description, coin_reward, xp_reward, is_recurring, is_open, do_together, require_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const cleanRoomResult = choresStmt.run(
    parentId,
    'Clean Room',
    'Tidy up your room and make your bed',
    15,
    75,
    1,
    0,
    0,
    0
  );
  const trashResult = choresStmt.run(
    parentId,
    'Take Out Trash',
    'Take the trash out to the curb',
    10,
    50,
    1,
    0,
    0,
    0
  );
  const dishesResult = choresStmt.run(
    parentId,
    'Do Dishes',
    'Wash and put away dinner dishes',
    12,
    60,
    0,
    1,
    0,
    0
  );

  const cleanRoomId = cleanRoomResult.lastInsertRowid;
  const trashId = trashResult.lastInsertRowid;
  const dishesId = dishesResult.lastInsertRowid;

  // Create chore assignments
  const assignStmt = db.prepare(
    'INSERT INTO chore_assignments (chore_id, kid_id) VALUES (?, ?)'
  );
  assignStmt.run(cleanRoomId, emmaId);
  assignStmt.run(cleanRoomId, jakeId);
  assignStmt.run(trashId, emmaId);
  assignStmt.run(dishesId, null); // Open chore

  // Create sample shop items
  const shopStmt = db.prepare(
    'INSERT INTO shop_items (parent_id, title, description, coin_cost, category, is_active) VALUES (?, ?, ?, ?, ?, ?)'
  );
  shopStmt.run(
    parentId,
    'Ice Cream Outing',
    'Family trip to the ice cream shop',
    50,
    'Experience',
    1
  );
  shopStmt.run(
    parentId,
    'Movie Night',
    'Pick a movie for family movie night',
    40,
    'Privilege',
    1
  );
  shopStmt.run(parentId, 'Skateboard Deck', 'New skateboard', 100, 'Physical', 1);
  shopStmt.run(
    parentId,
    'Tablet Time',
    '30 minutes of extra tablet time',
    25,
    'Privilege',
    1
  );

  // Create all 13 badges
  const badgesStmt = db.prepare(
    'INSERT INTO badges (slug, name, description, icon_emoji) VALUES (?, ?, ?, ?)'
  );
  badgesStmt.run('first_chore', 'First Quest', 'Complete your first chore', '🎯');
  badgesStmt.run('chore_5', 'Quest Master I', 'Complete 5 chores', '⭐');
  badgesStmt.run('chore_25', 'Quest Master II', 'Complete 25 chores', '✨');
  badgesStmt.run('chore_100', 'Quest Master III', 'Complete 100 chores', '🏆');
  badgesStmt.run('streak_3', 'On Fire!', 'Build a 3-day streak', '🔥');
  badgesStmt.run('streak_7', 'Hot Streak', 'Build a 7-day streak', '🌟');
  badgesStmt.run('streak_30', 'Legendary Streak', 'Build a 30-day streak', '👑');
  badgesStmt.run('coins_100', 'Coin Collector I', 'Earn 100 coins', '🪙');
  badgesStmt.run('coins_500', 'Coin Collector II', 'Earn 500 coins', '💰');
  badgesStmt.run('do_together_5', 'Team Player', 'Complete 5 together tasks', '🤝');
  badgesStmt.run('level_5', 'Level 5', 'Reach level 5', '📈');
  badgesStmt.run('level_10', 'Level 10', 'Reach level 10', '🚀');
  badgesStmt.run('first_redemption', 'Shop Champion', 'Redeem your first item', '🎁');

  console.log('Database seeded successfully!');
}

module.exports = { seed };
