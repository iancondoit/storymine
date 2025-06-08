#!/bin/bash

# StoryMine Railway Deployment
# Simple, reliable deployment to Railway cloud platform

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

print_status "🚀 Deploying StoryMine with Railway"
print_status "✅ Simple, fast deployment with automatic HTTPS!"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_status "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    print_status "Please log in to Railway..."
    railway login
fi

# Load environment variables
if [ ! -f .env.aws ]; then
    print_error ".env.aws file not found. Please run the database setup first."
    exit 1
fi

source .env.aws

print_status "Setting up Railway project..."

# Initialize Railway project if not already done
if [ ! -f railway.json ]; then
    print_status "Creating new Railway project..."
    railway init
fi

print_status "Setting environment variables..."

# Set environment variables in Railway
railway variables --set "NODE_ENV=production"
railway variables --set "DATABASE_URL=$DATABASE_URL"
railway variables --set "S3_BUCKET=$S3_BUCKET"
railway variables --set "AWS_REGION=$AWS_REGION"
railway variables --set "CLAUDE_API_KEY=$CLAUDE_API_KEY"
railway variables --set "PORT=3001"

print_status "Deploying to Railway..."

# Deploy to Railway
if railway up; then
    print_status "🎉 Deployment to Railway successful!"
    
    # Get the deployment URL
    RAILWAY_URL=$(railway status --json | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$RAILWAY_URL" ]; then
        print_status "🌐 Your app is available at: $RAILWAY_URL"
        print_status "🩺 Health check: $RAILWAY_URL/api/health"
    else
        print_status "🌐 Check your Railway dashboard for the deployment URL"
    fi
    
    print_status "💰 Cost: $5-20/month (much cheaper than AWS!)"
    
    echo ""
    print_status "🎯 Railway Deployment Complete!"
    echo "✅ Frontend deployed successfully"
    echo "✅ Backend deployed successfully"
    echo "✅ Environment variables configured"
    echo "✅ Automatic HTTPS enabled"
    echo ""
    print_status "Next steps:"
    echo "1. Test the application at your Railway URL"
    echo "2. Import Intelligence data to complete setup"
    echo "3. Configure custom domain (optional)"
    
else
    print_error "Railway deployment failed"
    print_status "Please check the Railway logs for more details"
    exit 1
fi

print_status "✅ StoryMine successfully deployed with Railway!" 