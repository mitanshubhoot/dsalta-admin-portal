#!/bin/bash

# Admin Activity Portal Setup Script
set -e

echo "🚀 Setting up Admin Activity Portal..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd web
npm install
cd ..

# Run database migrations
echo "🗄️  Running database migrations..."
cd server
npm run migrate:up
echo "✅ Database migrations completed"

# Seed sample data (optional)
read -p "🌱 Do you want to seed sample activity data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run seed
    echo "✅ Sample data seeded"
fi

cd ..

echo ""
echo "🎉 Setup completed!"
echo ""
echo "To start the application:"
echo "  Backend:  cd server && npm run dev"
echo "  Frontend: cd web && npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
echo "Access points:"
echo "  📊 Frontend:    http://localhost:3000"
echo "  🔧 API Docs:    http://localhost:3001/api/docs"
echo "  ❤️  Health:      http://localhost:3001/health"
echo ""
echo "Default admin credentials:"
echo "  Email:    admin@dsalta.com"
echo "  Password: SecureAdminPassword123!"
echo ""
echo "⚠️  Remember to update your .env file with actual values!"
