const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Automatically detect which database to use
const usePostgres = !!process.env.DATABASE_URL;
let db;

if (usePostgres) {
  // Use PostgreSQL (for Railway, Heroku, etc.)
  console.log('🐘 Using PostgreSQL database');
  const { Pool } = require('pg');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Initialize PostgreSQL table
  db.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id SERIAL PRIMARY KEY,
      address TEXT NOT NULL UNIQUE,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT,
      notes TEXT
    )
  `).then(() => {
    console.log('✅ PostgreSQL table initialized');
  }).catch(err => {
    console.error('❌ Error initializing PostgreSQL table:', err);
  });

} else {
  // Use SQLite (for local development)
  console.log('📁 Using SQLite database (local development)');
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database('./addresses.db', (err) => {
    if (err) {
      console.error('❌ Error opening SQLite database:', err.message);
    } else {
      console.log('✅ Connected to SQLite database');
      // Create table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL UNIQUE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        notes TEXT
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating SQLite table:', err.message);
        }
      });
    }
  });
}

// Database query helpers
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (usePostgres) {
      db.query(sql, params)
        .then(result => resolve(result.rows))
        .catch(reject);
    } else {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (usePostgres) {
      db.query(sql, params)
        .then(result => resolve({ lastID: result.rows[0]?.id, changes: result.rowCount }))
        .catch(reject);
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
};

// API Routes

// Submit an address
app.post('/api/submit-address', async (req, res) => {
  const { address, notes } = req.body;
  const userAgent = req.headers['user-agent'];

  // Basic validation
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid Ethereum address format' 
    });
  }

  try {
    const sql = usePostgres
      ? 'INSERT INTO addresses (address, user_agent, notes) VALUES ($1, $2, $3) RETURNING id'
      : 'INSERT INTO addresses (address, user_agent, notes) VALUES (?, ?, ?)';
    
    const result = await dbRun(sql, [address, userAgent, notes]);
    
    res.json({ 
      success: true, 
      message: 'Address submitted successfully',
      id: result.lastID 
    });
  } catch (err) {
    const isDuplicate = usePostgres 
      ? err.code === '23505' 
      : err.message.includes('UNIQUE constraint failed');
    
    if (isDuplicate) {
      return res.status(409).json({ 
        success: false, 
        message: 'This address has already been submitted' 
      });
    }
    console.error('Error inserting address:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving address' 
    });
  }
});

// Get all addresses (for admin)
app.get('/api/addresses', async (req, res) => {
  try {
    const sql = 'SELECT * FROM addresses ORDER BY timestamp DESC';
    const rows = await dbQuery(sql);
    
    res.json({ 
      success: true, 
      count: rows.length,
      addresses: rows 
    });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching addresses' 
    });
  }
});

// Get address count
app.get('/api/count', async (req, res) => {
  try {
    const sql = 'SELECT COUNT(*) as count FROM addresses';
    const rows = await dbQuery(sql);
    const count = usePostgres ? parseInt(rows[0].count) : rows[0].count;
    
    res.json({ 
      success: true, 
      count: count 
    });
  } catch (err) {
    console.error('Error counting addresses:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error counting addresses' 
    });
  }
});

// Delete an address (admin function)
app.delete('/api/addresses/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const sql = usePostgres
      ? 'DELETE FROM addresses WHERE id = $1'
      : 'DELETE FROM addresses WHERE id = ?';
    
    await dbRun(sql, [id]);
    
    res.json({ 
      success: true, 
      message: 'Address deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting address:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting address' 
    });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/collect', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'collect.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Collection page: http://localhost:${PORT}/collect`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`💾 Database: ${usePostgres ? 'PostgreSQL' : 'SQLite'}\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (usePostgres) {
    await db.end();
  } else {
    db.close((err) => {
      if (err) console.error('Error closing database:', err.message);
    });
  }
  console.log('\n💤 Database connection closed');
  process.exit(0);
});

module.exports = app;

