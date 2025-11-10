const { Pool } = require("pg");

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set!");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("🚀 Starting database migration...\n");

    // Check if columns already exist
    const checkColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'addresses'
      AND column_name IN ('signature', 'message')
    `);

    if (checkColumns.rows.length === 2) {
      console.log("✅ Migration already completed - signature and message columns exist");
      console.log("   No action needed.\n");
      await pool.end();
      return;
    }

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'addresses'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("⚠️  Table 'addresses' doesn't exist yet");
      console.log("   Start your server and it will be created automatically.\n");
      await pool.end();
      return;
    }

    // Count existing records
    const countResult = await pool.query("SELECT COUNT(*) FROM addresses");
    const existingCount = parseInt(countResult.rows[0].count);

    console.log(`📊 Found ${existingCount} existing address(es) in database\n`);

    if (existingCount === 0) {
      console.log("💡 No existing data found. Adding columns as required fields...\n");

      await pool.query(`
        ALTER TABLE addresses
        ADD COLUMN signature TEXT NOT NULL DEFAULT '',
        ADD COLUMN message TEXT NOT NULL DEFAULT ''
      `);

      // Remove defaults after adding
      await pool.query(`
        ALTER TABLE addresses
        ALTER COLUMN signature DROP DEFAULT,
        ALTER COLUMN message DROP DEFAULT
      `);

      console.log("✅ Migration completed successfully!");
      console.log("   Columns added: signature (TEXT, NOT NULL), message (TEXT, NOT NULL)\n");
    } else {
      console.log("⚠️  WARNING: Existing addresses found!");
      console.log("   These addresses were submitted WITHOUT signature verification.");
      console.log("   They cannot be verified and should probably be deleted.\n");

      console.log("Options:");
      console.log("1. Delete all existing unverified addresses (recommended)");
      console.log("2. Keep them but mark as legacy/unverified\n");

      console.log("🔧 Adding columns as nullable for now...\n");

      await pool.query(`
        ALTER TABLE addresses
        ADD COLUMN IF NOT EXISTS signature TEXT,
        ADD COLUMN IF NOT EXISTS message TEXT
      `);

      console.log("✅ Columns added successfully\n");
      console.log("⚠️  NEXT STEPS:");
      console.log("   Run ONE of these commands to complete the migration:\n");

      console.log("   Option 1 - Delete unverified addresses (recommended):");
      console.log("   DELETE FROM addresses WHERE signature IS NULL;\n");

      console.log("   Option 2 - Mark as legacy:");
      console.log("   UPDATE addresses SET");
      console.log("     signature = 'LEGACY_UNVERIFIED',");
      console.log("     message = 'Legacy address from before signature verification'");
      console.log("   WHERE signature IS NULL;\n");

      console.log("   After choosing, make columns required:");
      console.log("   ALTER TABLE addresses ALTER COLUMN signature SET NOT NULL;");
      console.log("   ALTER TABLE addresses ALTER COLUMN message SET NOT NULL;\n");

      console.log("   Or run this script with: node migrate.js --delete-legacy\n");
    }

    // If --delete-legacy flag is provided
    if (process.argv.includes("--delete-legacy") && existingCount > 0) {
      console.log("🗑️  Deleting legacy unverified addresses...\n");

      const deleteResult = await pool.query(
        "DELETE FROM addresses WHERE signature IS NULL"
      );

      console.log(`✅ Deleted ${deleteResult.rowCount} unverified address(es)\n`);

      console.log("🔧 Making columns required...\n");
      await pool.query(`
        ALTER TABLE addresses
        ALTER COLUMN signature SET NOT NULL,
        ALTER COLUMN message SET NOT NULL
      `);

      console.log("✅ Migration fully completed!");
      console.log("   All columns are now required and verified.\n");
    }

  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrate().then(() => {
  console.log("🎉 Done!\n");
  process.exit(0);
}).catch(error => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
