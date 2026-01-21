# Supabase Setup Guide

This guide will help you set up Supabase for the Padel Connect application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Fill in the project details:
   - Project name: `padel-connect` (or your preferred name)
   - Database password: (choose a strong password)
   - Region: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize

## Step 2: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your project:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the query editor
5. Click "Run" to execute the migration

This will create all necessary tables, indexes, Row Level Security policies, and triggers.

## Step 5: Verify the Database

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `profiles`
   - `teams`
   - `join_requests`
   - `challenges`
   - `league_settings`

## Step 6: Configure Authentication

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable "Email" provider
3. Configure email templates if desired (optional)
4. For development, you may want to disable email confirmations:
   - Go to **Authentication** → **Settings**
   - Disable "Enable email confirmations"

## Step 7: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try registering a new account
3. Create a team
4. Test the various features

## Database Schema Overview

### Tables

- **profiles**: User profiles (extends Supabase Auth users)
  - Links to auth.users via id (foreign key)
  - Stores user details (name, phone, gender, playtomic level)
  - team_id links to teams table

- **teams**: Padel teams
  - Contains team name, league (mens/womens), position
  - creator_id links to profiles

- **join_requests**: Requests to join teams
  - user_id and team_id link to respective tables
  - Status: pending, accepted, declined

- **challenges**: Match challenges between teams
  - challenger_team_id and challenged_team_id link to teams
  - Stores scores and validation status

- **league_settings**: Global league configuration
  - Challenge restriction date
  - Maximum position difference for challenges

### Security

Row Level Security (RLS) is enabled on all tables to ensure:
- Users can only see and modify their own data
- Team creators have additional permissions for their teams
- Public data (teams, profiles) is viewable by all authenticated users

### Real-time Updates

The application subscribes to database changes for:
- Teams
- Join requests
- Challenges
- Profile updates (team membership)

This ensures all users see live updates without refreshing the page.

## Troubleshooting

### Missing environment variables error
- Make sure `.env` file exists and contains valid credentials
- Restart the dev server after creating/updating `.env`

### Database connection errors
- Verify your Supabase project is active
- Check that your API credentials are correct
- Ensure your IP is not blocked (Supabase allows all IPs by default)

### Authentication errors
- Ensure email provider is enabled in Supabase
- Check that the migration created the profiles table and trigger
- Verify Row Level Security policies are in place

### Real-time not working
- Supabase's free tier includes real-time
- Check browser console for WebSocket connection errors
- Ensure real-time is enabled in your Supabase project settings

## Production Considerations

Before deploying to production:

1. **Enable email confirmations** in Authentication settings
2. **Set up custom SMTP** for email delivery (optional)
3. **Review and tighten RLS policies** if needed
4. **Set up database backups** (automatic in Supabase)
5. **Monitor database usage** and upgrade plan if needed
6. **Add proper error handling** and user feedback
7. **Implement rate limiting** for API calls
8. **Set up monitoring** and error tracking

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
