#!/bin/bash

# Second Brain - Docker Entrypoint Script
# Handles database setup and migrations on container startup

set -e

echo "========================================"
echo "Second Brain - Backend Service"
echo "========================================"

# Configuration
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-second_brain}"
DB_USER="${POSTGRES_USER:-secondbrain}"
DB_PASS="${POSTGRES_PASSWORD:-secondbrain_secret}"
DB_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Wait for database to be ready
wait_for_db() {
    print_status "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
            print_status "Database is ready!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "Database connection timeout after $max_attempts attempts"
    print_warning "The backend may still function if the database becomes available later."
    return 1
}

# Run database setup if needed
run_db_setup() {
    # Skip if already initialized
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM schema_migrations LIMIT 1" > /dev/null 2>&1; then
        print_status "Database already initialized"

        # Run pending migrations if any
        print_status "Checking for pending migrations..."
        cd /app
        node src/db/migrate.js migrate 2>/dev/null || {
            print_warning "Migration check failed (database may not be ready yet)"
        }
        return 0
    fi

    print_warning "Database not initialized. Running setup..."

    if wait_for_db; then
        print_status "Running database setup..."
        cd /app
        node src/db/migrate.js setup || {
            print_error "Database setup failed!"
            exit 1
        }
        print_status "Database setup complete!"
    else
        print_warning "Skipping database setup (will retry on first request)"
    fi
}

# Export database URL for application
export DATABASE_URL="$DB_URL"

# Run setup before starting application
if [ "$SKIP_DB_SETUP" != "true" ]; then
    run_db_setup
else
    print_warning "Database setup skipped (SKIP_DB_SETUP=true)"
fi

# Execute the main command
echo ""
echo "========================================"
print_status "Starting Second Brain backend..."
echo "========================================"

exec "$@"
