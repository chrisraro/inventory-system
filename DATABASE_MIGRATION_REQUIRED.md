# 🚨 IMPORTANT: Database Migration Required

## Current Issue
You're seeing **401 Unauthorized** errors because the new simplified database tables don't exist yet. The system has been completely revamped to use a new simplified schema.

## Required Action: Run Database Migration

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: **GasFlow Pro**

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** to create a new SQL script

### Step 3: Run Migration Script
1. Copy the **entire contents** of the file: [`scripts/create-simplified-qr-system.sql`](./scripts/create-simplified-qr-system.sql)
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the script

### Step 4: Verify Migration
After running the script, you should see:
- ✅ `products_simplified` table created
- ✅ `stock_movements_simplified` table created  
- ✅ Indexes and triggers created
- ✅ RLS policies applied
- ✅ Helper functions created

## What This Migration Does

### 🗄️ **Creates New Tables**
- **`products_simplified`** - Individual cylinder tracking (1 QR = 1 cylinder)
- **`stock_movements_simplified`** - Status-based movement tracking

### 🔧 **Key Features**
- **Simplified Schema** - Only essential fields (no brand, no stock levels)
- **QR-Focused** - Each QR code represents one unique cylinder
- **Status Tracking** - Available, Sold, Maintenance, Damaged, Missing
- **Automatic Updates** - Database triggers handle status changes
- **Weight Categories** - 11kg, 22kg, 50kg cylinder support

### 🛡️ **Security**
- Row Level Security (RLS) policies
- User-based data isolation
- Proper authentication checks

## After Migration

Once you run the script:
1. **Refresh your browser**
2. **All 401 errors will be resolved**
3. **Add Product functionality will work**
4. **Stock Movements will function properly**
5. **QR scanning workflow will be complete**

## Migration Script Location
The complete migration script is in:
```
scripts/create-simplified-qr-system.sql
```

## System Benefits After Migration
- ✅ **Simple** - No unnecessary complexity
- ✅ **QR-Focused** - Scan → Add → Track workflow  
- ✅ **Individual Tracking** - Each cylinder has unique status
- ✅ **Automatic** - Status updates via database triggers
- ✅ **Clean** - Removed all unnecessary fields

---

**🔥 Important:** The system will not work until you run this migration script in Supabase SQL Editor.