# Local Development Setup - Ultimate Stain Seal

This guide helps you run the Ultimate Stain Seal project locally on your machine (without Replit).

## Prerequisites

- **Node.js 24+** ([download](https://nodejs.org/))
- **PostgreSQL 16+** ([download](https://www.postgresql.org/download/))
- **pnpm** (installed globally: `npm install -g pnpm`)
- **Git**

## System Setup

### 1. Install PostgreSQL

#### Windows
- Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)
- During installation, remember the password you set for the `postgres` user
- Ensure PostgreSQL service is running

#### macOS (Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql-16
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL (Windows users may need to use psql from PostgreSQL bin directory)
psql -U postgres

# In psql prompt, create a database
CREATE DATABASE uss_dev;
\q
```

### 3. Install Dependencies

```bash
# Clone or navigate to the project
cd Ultimate-Stain-Seal

# Install pnpm if not already installed
npm install -g pnpm

# Install all workspace dependencies
pnpm install
```

## Environment Setup

### 1. Create `.env.local` file

Copy `.env.example` to `.env.local` in the root directory:

```bash
cp .env.example .env.local
```

### 2. Update `.env.local` with your values

```env
# PostgreSQL connection (adjust password and host as needed)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/uss_dev

NODE_ENV=development
API_PORT=8080
FRONTEND_PORT=5173
```

## Running the Project

### Option 1: Full Stack (Recommended)

In **Terminal 1** — Start the API server:
```bash
cd artifacts/api-server
pnpm run dev
```
The API should be available at `http://localhost:8080`

In **Terminal 2** — Start the frontend:
```bash
cd artifacts/uss-ops
pnpm run dev
```
The frontend should be available at `http://localhost:5173`

### Option 2: Using pnpm Filters

```bash
# Run all dev servers simultaneously (if you have multiple terminals)
pnpm --filter @workspace/api-server run dev &
pnpm --filter @workspace/uss-ops run dev
```

## Database Management

### Seed Database (Create Test Data)

```bash
pnpm --filter @workspace/db run push
# Then seed with:
node node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs artifacts/api-server/src/seed.ts
```

### Push Schema Changes

```bash
pnpm --filter @workspace/db run push
```

### Force Push (Overwrite — Use with Caution)

```bash
pnpm --filter @workspace/db run push-force
```

## TypeScript Type Checking

Run typechecks across the entire workspace:

```bash
pnpm run typecheck
```

## Building for Production

```bash
# Typecheck and build everything
pnpm run build

# Build individual packages
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/uss-ops run build
```

## Project Structure

```
Ultimate-Stain-Seal/
├── artifacts/
│   ├── api-server/          # Express API server
│   └── uss-ops/             # React + Vite frontend
├── lib/
│   ├── db/                  # Database schema (Drizzle ORM)
│   ├── api-zod/             # Zod validation schemas
│   ├── api-client-react/    # React API client
│   └── api-spec/            # OpenAPI specification
├── scripts/                 # Build and automation scripts
├── .env.example             # Environment variables template
└── pnpm-workspace.yaml      # Workspace configuration
```

## Troubleshooting

### PostgreSQL Connection Issues

**Error: "could not connect to server"**
- Ensure PostgreSQL service is running
- Check connection string in `.env.local`
- On Windows, verify the `postgres` user password

**Error: "database does not exist"**
- Create the database: `createdb -U postgres uss_dev`

### Port Already in Use

If ports 8080 or 5173 are already in use:
- Change `API_PORT` or `FRONTEND_PORT` in `.env.local`
- Or kill the process using the port

### Missing Dependencies

Run `pnpm install` from the root directory to ensure all dependencies are installed.

## Development Tips

- **Hot Reload**: The frontend (Vite) and API (if set up with nodemon) support hot reload
- **Database UI**: Consider installing [DBeaver](https://dbeaver.io/) to browse your PostgreSQL database
- **API Testing**: Use [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) to test API endpoints
- **VS Code Extensions**: Install "Drizzle ORM Editor" and "PostgreSQL" extensions for better DX

## Next Steps

1. Verify the API is running: `curl http://localhost:8080/api/health`
2. Open the frontend: `http://localhost:5173`
3. Check API documentation at `http://localhost:8080/api/docs` (if available)

## Reverting to Replit

If you need to return to Replit development:
- The `.replit` file has been archived as `.replit.backup`
- Restore it with: `mv .replit.backup .replit`

---

**Questions?** Check the main `replit.md` for project architecture details.
