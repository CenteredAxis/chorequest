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
  }

  return db;
}

module.exports = { getDb };
