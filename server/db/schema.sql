-- Parents table
CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Kids table
CREATE TABLE IF NOT EXISTS kids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  avatar_emoji TEXT,
  pin TEXT NOT NULL,
  coins INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  streak_last_date DATE,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL UNIQUE,
  household_name TEXT DEFAULT 'My Household',
  timezone TEXT DEFAULT 'UTC',
  coin_label TEXT DEFAULT 'Gold Coins',
  screensaver_timeout INTEGER DEFAULT 300,
  sounds_enabled INTEGER DEFAULT 1,
  FOREIGN KEY (parent_id) REFERENCES parents(id)
);

-- Chores table
CREATE TABLE IF NOT EXISTS chores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  coin_reward INTEGER DEFAULT 10,
  xp_reward INTEGER DEFAULT 50,
  is_recurring INTEGER DEFAULT 0,
  cron_schedule TEXT,
  is_open INTEGER DEFAULT 0,
  do_together INTEGER DEFAULT 0,
  do_together_bonus INTEGER DEFAULT 5,
  require_photo INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id)
);

-- Chore assignments table
CREATE TABLE IF NOT EXISTS chore_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL,
  kid_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (kid_id) REFERENCES kids(id)
);

-- Completions table
CREATE TABLE IF NOT EXISTS completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL,
  kid_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  photo_path TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  do_together_group_id INTEGER,
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (kid_id) REFERENCES kids(id)
);

-- Shop items table
CREATE TABLE IF NOT EXISTS shop_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  coin_cost INTEGER NOT NULL,
  category TEXT DEFAULT 'Physical',
  icon_emoji TEXT DEFAULT '🎁',
  stock INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id)
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_item_id INTEGER NOT NULL,
  kid_id INTEGER NOT NULL,
  coins_spent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at DATETIME,
  parent_note TEXT,
  FOREIGN KEY (shop_item_id) REFERENCES shop_items(id),
  FOREIGN KEY (kid_id) REFERENCES kids(id)
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT
);

-- Kid badges table
CREATE TABLE IF NOT EXISTS kid_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kid_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kid_id, badge_id),
  FOREIGN KEY (kid_id) REFERENCES kids(id),
  FOREIGN KEY (badge_id) REFERENCES badges(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reference_id INTEGER,
  reference_type TEXT,
  FOREIGN KEY (parent_id) REFERENCES parents(id)
);

-- AI-generated chore narratives cache
CREATE TABLE IF NOT EXISTS chore_narratives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL UNIQUE,
  narrative TEXT NOT NULL,
  chore_hash TEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chore_id) REFERENCES chores(id)
);
