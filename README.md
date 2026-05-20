# Majstr

A platform for finding and booking craftsman services in Slovakia.

**Tech stack:** Angular + NestJS + PostgreSQL + Prisma, Nx monorepo.

## Project structure

```
apps/
  web/          # Angular frontend (port 4200)
  api/          # NestJS backend  (port 3000)
libs/
  shared/       # Shared types, interfaces, DTOs
prisma/
  schema.prisma # Database schema
```

## Local development setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/OlehSarnovskyi/majstr.git
cd majstr
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` as needed:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/majster?schema=public"
JWT_SECRET="change-me-in-production"
```

### 3. Start PostgreSQL

If you don't have PostgreSQL yet, you can use Docker:

```bash
docker run --name majster-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=majster \
  -p 5432:5432 \
  -d postgres:16
```

Or install PostgreSQL locally and create the database:

```sql
CREATE DATABASE majster;
```

### 4. Generate Prisma client and run migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

When running the first migration, enter a name, e.g. `init`.

### 5. Start the application

```bash
# Start both API and Web at once:
npm run start:all

# Or each one separately in its own terminal:
npm run start:api    # http://localhost:3000/api
npm run start:web    # http://localhost:4200
```

The Angular dev server automatically proxies `/api/*` requests to the NestJS backend.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run start:api` | Start NestJS API |
| `npm run start:web` | Start Angular dev server |
| `npm run start:all` | Start both simultaneously |
| `npm run build` | Build all projects |
| `npm run lint` | Lint all projects |
| `npm run test` | Test all projects |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migration |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |

## API Endpoints

### Health check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register   # Register a new user
POST /api/auth/login      # Login (returns JWT token)
GET  /api/auth/me         # Current user profile (requires Bearer token)
```

#### Register example:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"jan@example.com","password":"secret123","firstName":"Jan","lastName":"Novak"}'
```

#### Login example:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jan@example.com","password":"secret123"}'
```
