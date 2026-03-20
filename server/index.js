require('dotenv').config();

const express = require('express');
const session = require('express-session');
const SqliteSessionStore = require('connect-sqlite3')(session);
const path = require('path');

const { getDb } = require('./db/database');
const { seed } = require('./db/seed');
const { startCronJobs } = require('./services/cronService');

// Middleware
const { requireParent, requireChild } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const kidsRoutes = require('./routes/kids');
const choresRoutes = require('./routes/chores');
const settingsRoutes = require('./routes/settings');
const shopRoutes = require('./routes/shop');
const badgesRoutes = require('./routes/badges');
const notificationsRoutes = require('./routes/notifications');
const uploadsRoutes = require('./routes/uploads');
const leaderboardRoutes = require('./routes/leaderboard');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
const dbPath = process.env.DB_PATH || '/data/chorequest.db';
const sessionStore = new SqliteSessionStore({
  db: path.basename(dbPath),
  dir: path.dirname(dbPath)
});

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

// Initialize database and seed
const db = getDb();
seed();

// Start cron jobs
startCronJobs(db);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kids', kidsRoutes);
app.use('/api/chores', choresRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);

// Serve static files from Vite build
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`ChoreQuest server running on port ${PORT}`);
});
