const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const PASSCODE = process.env.APP_PASSCODE || '1234';

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'workout.db');
const db = new Database(dbPath);

// Create logs table
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week INTEGER NOT NULL,
    day TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight_lbs REAL NOT NULL,
    reps INTEGER NOT NULL,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(week, day, exercise_id, set_number)
  )
`);

app.use(express.json());
app.use(express.static('public'));

// Static Program Data
const program = {
  upper: [
    { id: "bench_press", name: "BENCH PRESS", zone: "upper", type: "compound", sets: 4, rep_range: [6, 10], rest_seconds: 150, icon: "bench" },
    { id: "barbell_row", name: "BARBELL ROW", zone: "upper", type: "compound", sets: 4, rep_range: [6, 10], rest_seconds: 150, icon: "row" },
    { id: "overhead_press", name: "OVERHEAD PRESS", zone: "upper", type: "compound", sets: 3, rep_range: [6, 10], rest_seconds: 150, icon: "ohp" },
    { id: "lat_pulldown", name: "LAT PULLDOWN", zone: "upper", type: "compound", sets: 3, rep_range: [8, 10], rest_seconds: 120, icon: "pulldown" },
    { id: "lateral_raise", name: "LATERAL RAISE", zone: "upper", type: "isolation", sets: 3, rep_range: [10, 15], rest_seconds: 90, icon: "lateral" },
    { id: "bicep_curl", name: "BICEP CURL", zone: "upper", type: "isolation", sets: 2, rep_range: [10, 15], rest_seconds: 90, icon: "curl" },
    { id: "tricep_pushdown", name: "TRICEP PUSHDOWN", zone: "upper", type: "isolation", sets: 2, rep_range: [10, 15], rest_seconds: 90, icon: "pushdown" }
  ],
  lower: [
    { id: "squat", name: "SQUAT", zone: "lower", type: "compound", sets: 4, rep_range: [6, 10], rest_seconds: 150, icon: "squat" },
    { id: "romanian_deadlift", name: "RDL", zone: "lower", type: "compound", sets: 3, rep_range: [6, 10], rest_seconds: 150, icon: "rdl" },
    { id: "leg_press", name: "LEG PRESS", zone: "lower", type: "compound", sets: 3, rep_range: [8, 12], rest_seconds: 120, icon: "legpress" },
    { id: "leg_extension", name: "LEG EXTENSION", zone: "lower", type: "isolation", sets: 2, rep_range: [10, 15], rest_seconds: 90, icon: "legext" },
    { id: "calf_raise", name: "CALF RAISE", zone: "lower", type: "isolation", sets: 3, rep_range: [12, 15], rest_seconds: 60, icon: "calf" },
    { id: "plank", name: "PLANK (SEC)", zone: "lower", type: "core", sets: 3, rep_range: [30, 60], rest_seconds: 60, icon: "plank" }
  ]
};

// API Endpoints
app.post('/api/auth', (req, res) => {
  const { passcode } = req.body;
  if (passcode === PASSCODE) {
    res.json({ success: true, token: "authenticated" });
  } else {
    res.status(401).json({ success: false, error: 'Invalid passcode' });
  }
});

// Middleware for simple auth check
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === "Bearer authenticated") {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.get('/api/program', (req, res) => {
  res.json(program);
});

app.get('/api/logs', requireAuth, (req, res) => {
  const { week, exercise_id } = req.query;
  if (!week || !exercise_id) {
    return res.status(400).json({ error: 'Missing week or exercise_id' });
  }
  const logs = db.prepare('SELECT * FROM logs WHERE week = ? AND exercise_id = ? ORDER BY set_number').all(week, exercise_id);
  res.json(logs);
});

app.post('/api/logs', requireAuth, (req, res) => {
  const { week, day, exercise_id, set_number, weight_lbs, reps } = req.body;
  
  if (!week || !day || !exercise_id || !set_number || weight_lbs === undefined || reps === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stmt = db.prepare(`
    INSERT INTO logs (week, day, exercise_id, set_number, weight_lbs, reps) 
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(week, day, exercise_id, set_number) 
    DO UPDATE SET weight_lbs = excluded.weight_lbs, reps = excluded.reps, logged_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(week, day, exercise_id, set_number, weight_lbs, reps);
  res.json({ success: true });
});

app.get('/api/progress/:exercise_id', requireAuth, (req, res) => {
  const { exercise_id } = req.params;
  const logs = db.prepare(`
    SELECT week, MAX(weight_lbs) as max_weight, MAX(reps) as max_reps 
    FROM logs 
    WHERE exercise_id = ? 
    GROUP BY week
    ORDER BY week
  `).all(exercise_id);
  res.json(logs);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
