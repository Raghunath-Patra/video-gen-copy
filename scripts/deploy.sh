#!/bin/bash
# scripts/deploy.sh - Production deployment script for Railway

set -e

echo "🚀 Starting deployment to Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if logged in to Railway
if ! railway status &> /dev/null; then
    print_error "Not logged in to Railway. Please login first:"
    echo "railway login"
    exit 1
fi

# Verify environment variables
print_status "Checking environment variables..."

required_vars=(
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "ANTHROPIC_API_KEY"
    "SMALLEST_API_KEY"
)

for var in "${required_vars[@]}"; do
    if railway variables get $var &> /dev/null; then
        print_status "✅ $var is set"
    else
        print_warning "⚠️ $var is not set in Railway"
        read -p "Enter value for $var: " -s value
        echo
        railway variables set $var="$value"
        print_status "✅ $var has been set"
    fi
done

# Run tests before deployment
print_status "Running tests..."
if npm test; then
    print_status "✅ All tests passed"
else
    print_error "❌ Tests failed. Aborting deployment."
    exit 1
fi

# Test database connection
print_status "Testing database connection..."
if node scripts/database-utils.js health | grep -q "healthy"; then
    print_status "✅ Database connection successful"
else
    print_warning "⚠️ Database connection issues detected. Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_error "Deployment aborted due to database issues"
        exit 1
    fi
fi

# Deploy to Railway
print_status "Deploying to Railway..."
railway deploy

# Wait for deployment to complete
print_status "Waiting for deployment to complete..."
sleep 30

# Get the deployment URL
DEPLOYMENT_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -n "$DEPLOYMENT_URL" ]; then
    print_status "✅ Deployment successful!"
    print_status "🌍 Service URL: $DEPLOYMENT_URL"
    
    # Test the deployed service
    print_status "Testing deployed service..."
    if curl -f "$DEPLOYMENT_URL/health" &> /dev/null; then
        print_status "✅ Health check passed"
    else
        print_warning "⚠️ Health check failed - service may still be starting up"
    fi
    
    # Show deployment info
    print_status "📊 Deployment Information:"
    railway status
    
else
    print_error "❌ Deployment may have failed - could not get deployment URL"
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
echo
echo "Next steps:"
echo "  - Monitor logs: railway logs --follow"
echo "  - Check service status: railway status"
echo "  - View in dashboard: railway open"