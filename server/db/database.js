const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

let db = null;

function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || '/data/chorequest.db';
    const dbDir = path.dirname(dbPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Run schema on first open
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);

    // Migrations — add missing columns to existing tables
    const migrations = [
      { table: 'redemptions', column: 'coins_spent', sql: 'ALTER TABLE redemptions ADD COLUMN coins_spent INTEGER DEFAULT 0' },
      { table: 'redemptions', column: 'requested_at', sql: 'ALTER TABLE redemptions ADD COLUMN requested_at DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { table: 'redemptions', column: 'parent_note', sql: 'ALTER TABLE redemptions ADD COLUMN parent_note TEXT' },
      { table: 'shop_items', column: 'icon_emoji', sql: "ALTER TABLE shop_items ADD COLUMN icon_emoji TEXT DEFAULT '🎁'" },
      { table: 'shop_items', column: 'stock', sql: 'ALTER TABLE shop_items ADD COLUMN stock INTEGER' },
      { table: 'notifications', column: 'kid_id', sql: 'ALTER TABLE notifications ADD COLUMN kid_id INTEGER' },
      { table: 'notifications', column: 'payload', sql: 'ALTER TABLE notifications ADD COLUMN payload TEXT' },
      { table: 'chores', column: 'time_of_day', sql: "ALTER TABLE chores ADD COLUMN time_of_day TEXT DEFAULT 'anytime'" },
    ];

    for (const m of migrations) {
      try {
        const cols = db.prepare(`PRAGMA table_info(${m.table})`).all();
        if (!cols.find(c => c.name === m.column)) {
          db.exec(m.sql);
        }
      } catch (e) {
        // Column may already exist, ignore
      }
    }
  }

  return db;
}

module.exports = { getDb };
