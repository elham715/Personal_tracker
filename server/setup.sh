#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║       🚀 Habit Tracker Backend Setup Script 🚀      ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB Shell (mongosh) not found.${NC}"
    echo "   This is optional if using MongoDB Atlas."
else
    echo -e "${GREEN}✅ MongoDB Shell found${NC}"
fi

# Navigate to server directory
cd "$(dirname "$0")"

# Install dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed successfully${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file with your configuration${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Ask if user wants to seed database
echo -e "\n${BLUE}Would you like to seed the database with demo data?${NC}"
echo "This creates a demo user (email: demo@example.com, password: password123)"
read -p "Seed database? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${BLUE}🌱 Seeding database...${NC}"
    npm run seed
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seeded successfully${NC}"
        echo -e "\n${BLUE}Demo Login Credentials:${NC}"
        echo "Email: demo@example.com"
        echo "Password: password123"
    else
        echo -e "${RED}❌ Failed to seed database${NC}"
        echo "Make sure MongoDB is running and configured correctly."
    fi
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                  ✅ Setup Complete! ✅${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${BLUE}📚 Next Steps:${NC}"
echo "1. Make sure MongoDB is running"
echo "2. Start the server:"
echo -e "   ${YELLOW}npm run dev${NC}   (development mode)"
echo -e "   ${YELLOW}npm start${NC}     (production mode)"
echo ""
echo "3. Test the API:"
echo -e "   ${YELLOW}curl http://localhost:5000/health${NC}"
echo ""
echo "4. Read the documentation:"
echo "   - README.md - Overview"
echo "   - SETUP.md - Detailed setup guide"
echo "   - API_DOCS.md - API documentation"
echo "   - FEATURES.md - Feature breakdown"
echo ""
echo -e "${BLUE}🎉 Happy coding!${NC}"
