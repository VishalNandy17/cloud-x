#!/bin/bash

# D-CloudX Health Check Script
# This script verifies that all services are running properly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     D-CloudX Health Check                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

# Check Node.js
echo -e "${YELLOW}Checking prerequisites...${NC}"
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js $(node -v)"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm $(npm -v)"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker $(docker -v | grep -oP '(?<=version )[^,]*')"
else
    echo -e "${RED}✗${NC} Docker not found"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose $(docker-compose -v | grep -oP '(?<=version )[^,]*')"
else
    echo -e "${RED}✗${NC} Docker Compose not found"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking services...${NC}"

# Check MongoDB
echo -n "MongoDB... "
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} (not running)"
fi

# Check Redis
echo -n "Redis... "
if nc -z localhost 6379 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC} (not running)"
fi

# Check Backend API
echo -n "Backend API... "
if curl -s http://localhost:5000/api/v1/health > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⊘${NC} (not running)"
fi

# Check Frontend
echo -n "Frontend... "
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⊘${NC} (not running)"
fi

# Check Prometheus
echo -n "Prometheus... "
if curl -s http://localhost:9090 > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⊘${NC} (not running)"
fi

# Check Grafana
echo -n "Grafana... "
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⊘${NC} (not running)"
fi

# Check Elasticsearch
echo -n "Elasticsearch... "
if curl -s http://localhost:9200 > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⊘${NC} (not running)"
fi

# Check Kibana
echo -n "Kibana... "
if curl -s http://localhost:5601 > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⊘${NC} (not running)"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Health Check Complete              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
