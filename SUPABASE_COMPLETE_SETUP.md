# Complete Supabase Integration Setup Guide

## 🚨 CRITICAL: Step-by-Step Setup Required

### Step 1: Create Users Table (REQUIRED FIRST)
The complaint tables have foreign key constraints on `users(id)`. If this table doesn't exist, complaints cannot be created.

**Instructions:**
1. Go to your Supabase dashboard: https://app.supabase.com
2. Click **SQL Editor** → **New Query**
3. Copy and paste ALL content from `SUPABASE_USERS_TABLE.sql` in your workspace
4. Click **Run**
5. Wait for success confirmation
6. You should see: `Query executed successfully`

**What you're creating:**
- `users` table with id (UUID), name, email, password, phone, type, department_code
- Indexes for faster queries
- Row Level Security (RLS) policies

---

### Step 2: Create Department Complaint Tables (REQUIRED SECOND)
Without these tables, complaints cannot be stored.

**Instructions:**
1. Go to **SQL Editor** → **New Query**
2. Copy and paste ALL content from `SUPABASE_DEPARTMENT_TABLES.sql` in your workspace
3. Click **Run**
4. Wait for success confirmation

**What you're creating:**
- 4 complaint tables: `water_complaints`, `roads_complaints`, `electricity_complaints`, `garbage_complaints`
- `issue_remarks` table for department feedback
- Indexes for performance
- Row Level Security (RLS) policies

---

### Step 3: Create Storage Buckets (REQUIRED THIRD)
Files will be uploaded to these buckets.

**Instructions:**
1. Go to **Storage** tab in Supabase
2. Click **New Bucket** for each of these (mark as PUBLIC):
   - `complaint-images` - for photos of issues
   - `complaint-audio` - for audio recordings
   - `resolution-proofs` - for proof of resolution

3. For each bucket:
   - Name: (as listed above)
   - Permissions: Select **Public** (allow public access)
   - Click **Create Bucket**

**Expected result:** 3 buckets in Storage tab

---

### Step 4: Verify Environment Variables
Check that `.env.local` has all 3 required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ljrxeizeppqofogdemmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If missing:**
- Copy from your Supabase Project Settings → API
- NEXT_PUBLIC_SUPABASE_URL: Project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: anon public key
- SUPABASE_SERVICE_ROLE_KEY: service_role secret key

---

## ✅ Testing the Complete Flow

### Test Sequence:

**1. Register a new user:**
- Go to http://localhost:3000/login
- Click "Signup"
- Fill in name, email, password
- Click "Register"
- You should see: "Registration successful! Redirecting to login..."
- ✅ User is now in Supabase `users` table

**2. Login as that user:**
- Use the email/password you just registered
- Click "Login"
- ✅ You should be redirected to dashboard

**3. Submit a complaint:**
- Go to http://localhost:3000/report
- Fill in all required fields:
  - **Title**: "Pothole on Main Street"
  - **Category**: "Roads"
  - **Location**: "Main St, Downtown"
  - **Description**: "Large pothole in road"
  - **Contact Email**: your email
  - **Contact Phone**: any number
  - *Optional*: Upload a photo or record audio
- Click **Submit Complaint**
- ✅ You should see: "Success! Your complaint has been submitted"
- ✅ Should redirect to dashboard with complaint ID

**4. Verify in Supabase:**
- Go to Supabase → **Table Editor**
- Click on `roads_complaints` table
- You should see your complaint with:
  - title: "Pothole on Main Street"
  - location: "Main St, Downtown"
  - status: "pending"
  - user_id: your UUID

---

## 🐛 Troubleshooting Common Errors

### Error: "Cannot read properties of undefined (reading 'toLowerCase')"
**Cause:** Form error handling issue (already fixed!)
**Solution:** Rebuilt with better error parsing

### Error 500 when submitting: "User with ID [...] not found"
**Cause:** Users table doesn't exist or user not registered
**Solution:**
1. Run Step 1 (Create Users Table) from above
2. Register a new user (this creates entry in users table)
3. Then submit a complaint

### Error 500: "Failed to create complaint in roads"
**Cause:** Complaint table doesn't exist or foreign key issue
**Solution:**
1. Run Step 2 (Create Department Tables) from above
2. Verify `users` table exists first (Step 1)
3. Try submitting again

### File upload fails silently
**Cause:** Storage buckets not created
**Solution:**
1. Run Step 3 (Create Storage Buckets)
2. Verify all 3 buckets are PUBLIC
3. Upload file again

### "Sending request but no response" or timeout
**Cause:** API route server issue or network problem
**Solution:**
```bash
# Kill old dev server
taskkill /PID <PID> /F   # Windows
# or
pkill -f "next dev"       # Mac/Linux

# Restart dev server
npm run dev
```

---

## 📊 Database Connection Test

To verify Supabase is connected, check the console logs:

**Expected logs when submitting complaint:**
```
Form category: roads Lowercase: roads Department: roads
Submitting complaint for department: roads
Sending request to: /api/complaints-supabase/roads
Response status: 201             ← Success code
Complaint submitted successfully: { id: "...", title: "..." }
```

**If you see:**
```
Response status: 500             ← Server error
Error submitting complaint: Error: ...
```

Check the full error message in the console and refer to the troubleshooting section above.

---

## 📋 Checklist: Completion Status

- [ ] Step 1: Users table created (run SUPABASE_USERS_TABLE.sql)
- [ ] Step 2: Complaint tables created (run SUPABASE_DEPARTMENT_TABLES.sql)
- [ ] Step 3: Storage buckets created (3 PUBLIC buckets)
- [ ] Step 4: .env.local has all 3 environment variables
- [ ] User registered successfully
- [ ] User can login
- [ ] User can submit complaint with all fields
- [ ] Complaint appears in Supabase dashboard
- [ ] Files uploaded to storage buckets

---

## 🆘 Still Having Issues?

1. **Check browser console** (F12 → Console tab):
   - Look for form/submission errors
   - Copy full error message

2. **Check server console** (terminal running `npm run dev`):
   - Look for API errors
   - Copy full error message

3. **Check Supabase dashboard**:
   - Verify tables exist (Table Editor)
   - Verify buckets exist (Storage)
   - Check for RLS policy errors (Settings → Policies)

4. **For support:**
   - Provide: Full error message + console logs + steps to reproduce
   - Check: All 3 SQL migration steps completed
   - Verify: Environment variables are correct
