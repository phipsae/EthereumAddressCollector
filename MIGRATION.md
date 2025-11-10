# Database Migration Guide

## Changes Made

The application now requires **wallet signature verification** for all address submissions. This ensures that users can only submit addresses they actually control.

## Database Schema Changes

The `addresses` table has been updated with two new required fields:

```sql
ALTER TABLE addresses
ADD COLUMN signature TEXT NOT NULL,
ADD COLUMN message TEXT NOT NULL;
```

## Migration Steps

If you have an existing database with addresses, you'll need to handle the migration:

### Option 1: Start Fresh (Recommended for testing)

Drop and recreate the table. The server will automatically create the new schema on startup:

```sql
DROP TABLE addresses;
```

Then restart the server. It will create the new table with the correct schema.

### Option 2: Preserve Existing Data

If you need to keep existing addresses, you'll need to add the columns as nullable first:

```sql
ALTER TABLE addresses
ADD COLUMN signature TEXT,
ADD COLUMN message TEXT;
```

**Note:** Existing addresses without signatures cannot be verified and should be considered unverified. You may want to:

- Mark them separately
- Delete them
- Require users to re-submit with signatures

## What Changed

### Frontend (`collect.html`)

- ❌ Removed manual address entry option
- ✅ Users must connect their wallet (MetaMask, etc.)
- ✅ Users must sign a message to prove ownership
- ✅ Added security notice about signature requirement

### Backend (`server.js`)

- ✅ Added signature verification using ethers.js
- ✅ Rejects submissions without valid signatures
- ✅ Validates that signature matches submitted address
- ✅ Stores signature and message for audit trail

## Security Benefits

1. **Proof of Ownership**: Users must prove they control the wallet by signing
2. **No Fake Submissions**: Can't submit someone else's address
3. **Audit Trail**: Signatures are stored and can be verified later
4. **Non-repudiation**: Cryptographic proof of submission

## User Experience

When users submit an address:

1. They connect their wallet
2. Select the address they want to submit
3. Click "Sign & Submit Address"
4. MetaMask (or their wallet) prompts them to sign a message
5. The signature is verified on the backend
6. Only then is the address saved

The message they sign includes:

- Their address
- Current timestamp
- Clear statement of intent
