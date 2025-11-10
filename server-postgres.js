const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database table
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        address TEXT NOT NULL UNIQUE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        notes TEXT
      )
    `);
    console.log('Database table initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initializeDatabase();

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
    const result = await pool.query(
      'INSERT INTO addresses (address, user_agent, notes) VALUES ($1, $2, $3) RETURNING id',
      [address, userAgent, notes]
    );
    res.json({
      success: true,
      message: 'Address submitted successfully',
      id: result.rows[0].id
    });
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
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
    const result = await pool.query(
      'SELECT * FROM addresses ORDER BY timestamp DESC'
    );
    res.json({
      success: true,
      count: result.rows.length,
      addresses: result.rows
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
    const result = await pool.query('SELECT COUNT(*) as count FROM addresses');
    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
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
    await pool.query('DELETE FROM addresses WHERE id = $1', [id]);
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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Collection page: http://localhost:${PORT}/collect`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('\nDatabase connection closed');
  process.exit(0);
});

// Export for Vercel
module.exports = app;
