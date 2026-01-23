#!/bin/bash

# Second Brain - Database Setup Script
# This script handles first-time database initialization and migrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Second Brain - Database Setup Script              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo

# Configuration with defaults
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-second_brain}"
DB_USER="${POSTGRES_USER:-secondbrain}"
DB_PASS="${POSTGRES_PASSWORD:-secondbrain_secret}"
DB_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Parse command line arguments
COMMAND="${1:-setup}"
DRY_RUN=false
SKIP_CONFIRM=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        --skip-confirm)
            SKIP_CONFIRM=true
            ;;
        --help|-h)
            echo "Usage: $0 [command] [options]"
            echo
            echo "Commands:"
            echo "  setup      Run first-time database setup (default)"
            echo "  migrate    Apply pending migrations"
            echo "  status     Check database and migration status"
            echo "  rollback   Rollback last migration"
            echo
            echo "Options:"
            echo "  --dry-run     Preview without making changes"
            echo "  --skip-confirm Skip confirmation prompts"
            echo "  --help        Show this help message"
            exit 0
            ;;
    esac
done

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Function to check if database is ready
wait_for_db() {
    print_info "Waiting for database to be ready..."
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
    exit 1
}

# Function to check if migration table exists
check_migration_table() {
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1 FROM schema_migrations LIMIT 1" > /dev/null 2>&1
}

# Function to get migration status
get_migration_status() {
    local total=$(ls -1 /app/src/db/migrations/*.js 2>/dev/null | wc -l)
    local applied=0
    
    if check_migration_table; then
        applied=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM schema_migrations" 2>/dev/null | tr -d ' ')
    fi
    
    echo "$total $applied"
}

# Function to run migrations via Node.js
run_migrations() {
    local status=($(get_migration_status))
    local total="${status[0]}"
    local applied="${status[1]}"
    local pending=$((total - applied))
    
    if [ "$pending" -eq 0 ]; then
        print_status "No pending migrations. Database is up to date."
        return 0
    fi
    
    print_info "Found $pending pending migration(s)"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN - The following migrations would be applied:"
        ls -1 /app/src/db/migrations/*.js 2>/dev/null | while read f; do
            local name=$(basename "$f")
            echo "  - $name"
        done
        return 0
    fi
    
    if [ "$SKIP_CONFIRM" = false ]; then
        read -p "Apply $pending migration(s)? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Migration cancelled"
            exit 0
        fi
    fi
    
    print_info "Running migrations..."
    cd /app
    
    if node src/db/migrate.js migrate; then
        print_status "All migrations applied successfully!"
    else
        print_error "Migration failed!"
        exit 1
    fi
}

# Function to run first-time setup
do_setup() {
    echo -e "${BLUE}First-Time Database Setup${NC}"
    echo "================================"
    echo
    
    print_info "Configuration:"
    echo "  Host:     $DB_HOST"
    echo "  Port:     $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User:     $DB_USER"
    echo
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN - Would perform the following actions:"
        echo "  1. Wait for database connection"
        echo "  2. Enable pgvector extension"
        echo "  3. Create schema_migrations table"
        echo "  4. Apply all migrations"
        exit 0
    fi
    
    if [ "$SKIP_CONFIRM" = false ]; then
        read -p "Proceed with setup? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Setup cancelled"
            exit 0
        fi
    fi
    
    # Wait for database
    wait_for_db
    
    # Check if already initialized
    if check_migration_table; then
        print_warning "Database appears to already be set up."
        print_info "Run migrations instead with: $0 migrate"
        run_migrations
        exit 0
    fi
    
    # Run setup via Node.js
    print_info "Initializing database..."
    cd /app
    
    if node src/db/migrate.js setup; then
        echo
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    Setup Complete!                         ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo
        print_status "Database has been initialized successfully!"
        print_info "You can now start using the Second Brain API."
    else
        print_error "Setup failed!"
        exit 1
    fi
}

# Function to show database status
show_status() {
    echo -e "${BLUE}Database Status${NC}"
    echo "================"
    echo
    
    # Check database connection
    if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
        print_error "Cannot connect to database"
        exit 1
    fi
    
    print_status "Database connection: OK"
    
    # Check migration table
    if check_migration_table; then
        local status=($(get_migration_status))
        local total="${status[0]}"
        local applied="${status[1]}"
        local pending=$((total - applied))
        
        echo
        print_info "Migration Status:"
        echo "  Total migrations:  $total"
        echo "  Applied:           $applied"
        echo "  Pending:           $pending"
        
        if [ "$pending" -gt 0 ]; then
            print_warning "$pending migration(s) are pending"
        else
            print_status "Database is up to date"
        fi
    else
        print_warning "Migration table not found. Run setup first."
    fi
    
    # List tables
    echo
    print_info "Tables in database:"
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public'" 2>/dev/null | while read table; do
        if [ -n "$table" ]; then
            echo "  - $table"
        fi
    done
}

# Execute command
case "$COMMAND" in
    setup)
        do_setup
        ;;
    migrate)
        wait_for_db
        run_migrations
        ;;
    status)
        show_status
        ;;
    rollback)
        print_info "Rolling back last migration..."
        wait_for_db
        cd /app
        node src/db/migrate.js rollback
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo "Run $0 --help for usage information"
        exit 1
        ;;
esac
