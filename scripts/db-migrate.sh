#!/bin/bash
# Database migration script for CI/CD
# Usage: ./scripts/db-migrate.sh [--seed]

set -e

echo "=== ChoreChamp Database Migration ==="
echo ""

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "Step 1: Push schema to database..."
pnpm db:push

echo ""
echo "Step 2: Verify database tables..."
pnpm db:verify

# Optionally seed the database
if [ "$1" == "--seed" ]; then
  echo ""
  echo "Step 3: Seeding database..."
  pnpm db:seed
fi

echo ""
echo "=== Migration complete ==="
