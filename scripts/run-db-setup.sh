#!/bin/bash

# StoryMine Database Setup Script
# Connects to AWS RDS and sets up the Intelligence schema

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client (psql) not found. Please install it:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Load environment variables
if [ ! -f .env.aws ]; then
    print_error ".env.aws file not found. Please run the deployment script first."
    exit 1
fi

source .env.aws

# Validate required variables
if [ -z "$DB_PASSWORD" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_ENDPOINT" ]; then
    print_error "Missing database connection details in .env.aws"
    print_error "Required: DB_PASSWORD, DB_USERNAME, DB_ENDPOINT"
    exit 1
fi

# Create connection string
DATABASE_URL="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/storymine"

print_status "Connecting to StoryMine database..."
print_status "Host: $DB_ENDPOINT"
print_status "Database: storymine"
print_status "User: $DB_USERNAME"

# Test connection first
print_status "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    print_error "Failed to connect to database. Please check:"
    echo "  1. Database is running (may take 10-15 minutes after creation)"
    echo "  2. Security groups allow connections"
    echo "  3. Credentials are correct"
    exit 1
fi

print_status "✅ Database connection successful!"

# Run the schema setup
print_status "Setting up StoryMine Intelligence database schema..."
if psql "$DATABASE_URL" -f scripts/setup-database.sql; then
    print_status "✅ Database schema setup complete!"
else
    print_error "❌ Database schema setup failed!"
    exit 1
fi

# Verify the setup
print_status "Verifying database setup..."
psql "$DATABASE_URL" -c "
    SELECT 
        'Articles table' as table_name, 
        COUNT(*) as row_count 
    FROM intelligence_articles
    UNION ALL
    SELECT 
        'Entities table' as table_name, 
        COUNT(*) as row_count 
    FROM intelligence_entities
    UNION ALL
    SELECT 
        'Relationships table' as table_name, 
        COUNT(*) as row_count 
    FROM intelligence_relationships
    UNION ALL
    SELECT 
        'Stories table' as table_name, 
        COUNT(*) as row_count 
    FROM intelligence_stories;
"

print_status "✅ StoryMine database is ready for Intelligence data!"
print_status "Next step: Import StoryMap Intelligence data"

# Save the connection string for later use
echo "DATABASE_URL=$DATABASE_URL" >> .env.aws
print_status "Database connection string saved to .env.aws" 