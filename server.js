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
    { id: "flat_db_press", name: "Flat DB Press", zone: "upper", type: "compound", sets: 4, rep_range: [6, 10], rest_seconds: 150 },
    { id: "incline_db_press", name: "Incline DB Press", zone: "upper", type: "compound", sets: 3, rep_range: [6, 10], rest_seconds: 150 },
    { id: "overhead_press", name: "Overhead Press", zone: "upper", type: "compound", sets: 3, rep_range: [6, 10], rest_seconds: 150 },
    { id: "barbell_row", name: "Barbell Row", zone: "upper", type: "compound", sets: 4, rep_range: [6, 10], rest_seconds: 150 },
    { id: "lat_pulldown", name: "Lat Pulldown", zone: "upper", type: "compound", sets: 3, rep_range: [8, 10], rest_seconds: 120 },
    { id: "lateral_raise", name: "Lateral Raise", zone: "upper", type: "isolation", sets: 3, rep_range: [10, 15], rest_seconds: 75 },
    { id: "bicep_curl", name: "Bicep Curl", zone: "upper", type: "isolation", sets: 2, rep_range: [10, 15], rest_seconds: 75 },
    { id: "tricep_pushdown", name: "Tricep Pushdown", zone: "upper", type: "isolation", sets: 2, rep_range: [10, 15], rest_seconds: 75 }
  ],
  lower: [
    { id: "squat", name: "Squat", zone: "lower", type: "compound", sets: 4, rep_range: [6, 10], rest_seconds: 150 },
    { id: "romanian_deadlift", name: "Romanian Deadlift", "zone": "lower", type: "compound", sets: 3, rep_range: [6, 10], rest_seconds: 150 },
    { id: "leg_press", name: "Leg Press", zone: "lower", type: "compound", sets: 3, rep_range: [8, 12], rest_seconds: 120 },
    { id: "leg_extension", name: "Leg Extension", zone: "lower", type: "isolation", sets: 2, rep_range: [10, 15], rest_seconds: 75 },
    { id: "calf_raise", name: "Calf Raise", zone: "lower", type: "isolation", sets: 3, rep_range: [12, 15], rest_seconds: 60 },
    { id: "plank", name: "Plank", zone: "lower", type: "core", sets: 3, rep_range: [30, 60], rest_seconds: 60, unit: "seconds" }
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
  const { week, day, exercise_id } = req.query;
  if (!week || !exercise_id) {
    return res.status(400).json({ error: 'Missing week or exercise_id' });
  }
  
  let query = 'SELECT * FROM logs WHERE week = ? AND exercise_id = ?';
  let params = [week, exercise_id];
  
  if (day) {
    query += ' AND day = ?';
    params.push(day);
  }
  query += ' ORDER BY set_number';
  
  const logs = db.prepare(query).all(...params);
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
