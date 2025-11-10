const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize SQLite Database
const db = new sqlite3.Database('./addresses.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL UNIQUE,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_agent TEXT,
      notes TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      }
    });
  }
});

// API Routes

// Submit an address
app.post('/api/submit-address', (req, res) => {
  const { address, notes } = req.body;
  const userAgent = req.headers['user-agent'];

  // Basic validation
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Ethereum address format'
    });
  }

  const sql = `INSERT INTO addresses (address, user_agent, notes) VALUES (?, ?, ?)`;
  db.run(sql, [address, userAgent, notes], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          success: false,
          message: 'This address has already been submitted'
        });
      }
      console.error('Error inserting address:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Error saving address'
      });
    }
    res.json({
      success: true,
      message: 'Address submitted successfully',
      id: this.lastID
    });
  });
});

// Get all addresses (for admin)
app.get('/api/addresses', (req, res) => {
  const sql = `SELECT * FROM addresses ORDER BY timestamp DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching addresses:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Error fetching addresses'
      });
    }
    res.json({
      success: true,
      count: rows.length,
      addresses: rows
    });
  });
});

// Get address count
app.get('/api/count', (req, res) => {
  const sql = `SELECT COUNT(*) as count FROM addresses`;
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error('Error counting addresses:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Error counting addresses'
      });
    }
    res.json({
      success: true,
      count: row.count
    });
  });
});

// Delete an address (admin function)
app.delete('/api/addresses/:id', (req, res) => {
  const id = req.params.id;
  const sql = `DELETE FROM addresses WHERE id = ?`;
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting address:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Error deleting address'
      });
    }
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  });
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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Collection page: http://localhost:${PORT}/collect`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    console.log('\nDatabase connection closed');
    process.exit(0);
  });
});
