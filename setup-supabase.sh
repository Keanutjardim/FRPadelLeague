#!/bin/bash

echo "========================================"
echo "Padel Connect - Supabase Setup Script"
echo "========================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    echo ""
    echo "Please install Supabase CLI using one of these methods:"
    echo ""
    echo "1. Using npm:"
    echo "   npm install -g supabase"
    echo ""
    echo "2. Using Homebrew (macOS):"
    echo "   brew install supabase/tap/supabase"
    echo ""
    echo "3. Using Scoop (Windows):"
    echo "   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "   scoop install supabase"
    echo ""
    echo "After installing, run this script again."
    exit 1
fi

echo "Supabase CLI found!"
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo ".env file already exists."
    read -p "Do you want to update it? (y/n): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "Skipping .env creation..."
    else
        ENV_SETUP=true
    fi
else
    ENV_SETUP=true
fi

# Environment setup
if [ "$ENV_SETUP" = true ]; then
    echo ""
    echo "========================================"
    echo "Step 1: Environment Variables Setup"
    echo "========================================"
    echo ""
    echo "Please enter your Supabase project details:"
    echo "(You can find these at https://app.supabase.com/project/_/settings/api)"
    echo ""

    read -p "Supabase Project URL: " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY

    echo ""
    echo "Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

    echo ".env file created successfully!"
    echo ""
fi

# Login
echo "========================================"
echo "Step 2: Supabase Login"
echo "========================================"
echo ""
echo "Please login to Supabase..."
supabase login

if [ $? -ne 0 ]; then
    echo "Login failed. Please try again."
    exit 1
fi

# Link project
echo ""
echo "========================================"
echo "Step 3: Link to Project"
echo "========================================"
echo ""
read -p "Enter your Supabase project reference ID (from project URL): " PROJECT_REF

supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "Failed to link project. Please check your project reference."
    exit 1
fi

# Run migration
echo ""
echo "========================================"
echo "Step 4: Run Database Migration"
echo "========================================"
echo ""
echo "Applying database migration..."

supabase db push

if [ $? -ne 0 ]; then
    echo "Migration failed. You may need to run it manually."
    echo ""
    echo "Manual steps:"
    echo "1. Go to https://app.supabase.com/project/$PROJECT_REF/sql/new"
    echo "2. Copy the contents of supabase/migrations/001_initial_schema.sql"
    echo "3. Paste and run it in the SQL Editor"
    exit 1
fi

echo ""
echo "========================================"
echo "Setup Complete! ✓"
echo "========================================"
echo ""
echo "Your Padel Connect app is now connected to Supabase!"
echo ""
echo "Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Start the dev server: npm run dev"
echo "3. Create your first user account"
echo ""
