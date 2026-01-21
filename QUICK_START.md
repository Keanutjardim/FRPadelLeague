# Quick Start Guide - Supabase Setup

This guide will get you up and running with Supabase in just a few minutes.

## Option 1: Automated Setup (Recommended)

### Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase dashboard
3. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

### Run the Setup Script

**Windows:**
```bash
setup-supabase.bat
```

**Mac/Linux:**
```bash
chmod +x setup-supabase.sh
./setup-supabase.sh
```

The script will:
- Create your `.env` file with Supabase credentials
- Login to Supabase
- Link your local project to your Supabase project
- Run the database migration automatically

---

## Option 2: Manual Setup (5 minutes)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and enter:
   - Project name: `padel-connect`
   - Database password: (save this somewhere safe)
   - Region: (closest to you)
4. Wait for project to initialize (~2 minutes)

### Step 2: Get Your Credentials
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

### Step 3: Create .env File
1. Create a file called `.env` in your project root
2. Add these lines (replace with your actual values):
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 4: Run Database Migration
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Open `supabase/migrations/001_initial_schema.sql` in your project
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** (bottom right)
7. You should see "Success. No rows returned"

### Step 5: Configure Authentication
1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. (Optional) For development, disable email confirmations:
   - Go to **Authentication** → **Settings**
   - Scroll to "Enable email confirmations"
   - Toggle it OFF

### Step 6: Start Your App
```bash
npm install
npm run dev
```

Visit http://localhost:5173 and create your first account!

---

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure your `.env` file exists in the project root
- Restart your dev server after creating `.env`
- Check that the variable names start with `VITE_`

### Migration fails / SQL errors
- Make sure you copied the ENTIRE SQL file
- Check that your project is active (not paused)
- Try running the migration again

### Can't login after creating account
- Check browser console for errors
- Verify your `.env` credentials are correct
- Make sure the migration ran successfully (check Tables in Supabase dashboard)

### No tables showing in Supabase
- The migration didn't run successfully
- Go back to Step 4 and run the migration again

---

## Verify Setup

After setup, you should see these tables in Supabase **Table Editor**:
- ✓ profiles
- ✓ teams
- ✓ join_requests
- ✓ challenges
- ✓ league_settings

If you see all 5 tables, you're ready to go!

---

## What's Next?

1. Create a user account in your app
2. Create or join a team
3. Start challenging other teams!

For more details, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
