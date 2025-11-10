# Railway Database Migration Guide

## Overview

You need to add two new required columns (`signature` and `message`) to your existing `addresses` table in Railway's PostgreSQL database.

## Option 1: Using Railway Dashboard (Recommended)

### Step 1: Access the Database
1. Go to your Railway dashboard
2. Click on your PostgreSQL service
3. Go to the **"Data"** tab
4. Click **"Query"** to open the SQL query interface

### Step 2: Check Existing Data
First, see if you have any existing addresses:

```sql
SELECT COUNT(*) FROM addresses;
```

### Step 3A: If You Want to Keep Existing Data

Add columns as nullable first, then decide what to do with old records:

```sql
-- Add columns as nullable
ALTER TABLE addresses
ADD COLUMN signature TEXT,
ADD COLUMN message TEXT;
```

**Important:** Existing records will have NULL values for these fields. You have a few options:

1. **Delete old unverified addresses:**
```sql
DELETE FROM addresses WHERE signature IS NULL;
```

2. **Keep them but mark differently** (requires updating your admin view to show verified vs unverified):
```sql
-- Just leave them with NULL values
-- Update your queries to handle this
```

3. **Add default placeholder values** (not recommended as these aren't real signatures):
```sql
UPDATE addresses
SET signature = 'LEGACY_UNVERIFIED',
    message = 'Legacy address from before signature verification'
WHERE signature IS NULL;

-- Then make them NOT NULL
ALTER TABLE addresses ALTER COLUMN signature SET NOT NULL;
ALTER TABLE addresses ALTER COLUMN message SET NOT NULL;
```

### Step 3B: If You Want to Start Fresh (Simplest)

Drop the table and let the server recreate it:

```sql
DROP TABLE addresses;
```

Then restart your Railway service. The server will automatically create the new table schema with the required fields.

## Option 2: Using Railway CLI

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 2: Link to Your Project
```bash
cd /path/to/your/project
railway link
```

### Step 3: Connect to Database
```bash
railway run psql $DATABASE_URL
```

### Step 4: Run Migration SQL
Once connected, run the same SQL commands from Option 1, Step 3.

## Option 3: Create a Migration Script

Create a one-time migration endpoint in your server:

### Create `migrate.js`

```javascript
const { Pool } = require("pg");

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("Starting migration...");

    // Check if columns already exist
    const checkColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'addresses'
      AND column_name IN ('signature', 'message')
    `);

    if (checkColumns.rows.length === 2) {
      console.log("✅ Migration already completed - columns exist");
      await pool.end();
      return;
    }

    // Option A: Keep existing data (columns as nullable)
    await pool.query(`
      ALTER TABLE addresses
      ADD COLUMN IF NOT EXISTS signature TEXT,
      ADD COLUMN IF NOT EXISTS message TEXT
    `);
    console.log("✅ Added signature and message columns");

    // Count existing records without signatures
    const result = await pool.query(
      "SELECT COUNT(*) FROM addresses WHERE signature IS NULL"
    );
    console.log(`⚠️  ${result.rows[0].count} existing records have no signatures`);
    console.log("⚠️  Consider deleting these unverified addresses");

    // Uncomment to delete old records:
    // await pool.query("DELETE FROM addresses WHERE signature IS NULL");
    // console.log("✅ Deleted unverified addresses");

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await pool.end();
  }
}

migrate();
```

### Run the migration:

```bash
# Locally (make sure DATABASE_URL is set)
node migrate.js

# Or via Railway:
railway run node migrate.js
```

### After migration, delete the migrate.js file

## Option 4: Add Migration Endpoint (Temporary)

Add this to your `server.js` temporarily:

```javascript
// TEMPORARY: Remove after migration
app.get("/admin/migrate", async (req, res) => {
  try {
    // Add columns
    await pool.query(`
      ALTER TABLE addresses
      ADD COLUMN IF NOT EXISTS signature TEXT,
      ADD COLUMN IF NOT EXISTS message TEXT
    `);

    // Count unverified
    const result = await pool.query(
      "SELECT COUNT(*) FROM addresses WHERE signature IS NULL"
    );

    res.json({
      success: true,
      message: "Migration completed",
      unverified_count: result.rows[0].count,
      note: "You may want to delete unverified addresses"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Deploy, visit `/admin/migrate`, then remove this endpoint and redeploy.

## Recommended Approach

**For most users:** Use **Option 1, Step 3B** (drop and recreate) if:
- You don't have important production data yet
- You're still in testing/development
- The addresses were collected without verification anyway

**For production data:** Use **Option 1, Step 3A** with deletion of unverified addresses, since the old addresses can't be verified anyway.

## After Migration

1. Redeploy your Railway service with the updated code
2. Test the signature flow by submitting a new address
3. Verify in the admin panel that signatures are being stored
4. Remove any temporary migration code

## Troubleshooting

### Error: "column already exists"
The migration was already run. Check your table schema:
```sql
\d addresses
```

### Error: "null value in column violates not-null constraint"
You're trying to make columns NOT NULL but have existing NULL values. Delete or update those records first.

### Can't connect to database
Make sure your DATABASE_URL environment variable is set correctly in Railway.
