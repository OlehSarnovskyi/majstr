# Majstr

A platform for finding and booking craftsman services (plumbers, electricians, repairs) in Slovakia.

**Status: frozen — August 2026.** The project reached production and is left running in
maintenance mode. It is not actively developed and no new features are planned. No company
was ever incorporated around it; there is no commercial operation to wind down. The code
is kept public as a portfolio reference and the deployment is kept alive because it costs
nothing to do so.

**Tech stack:** Angular + NestJS + PostgreSQL + Prisma, Nx monorepo.
Deployed on Vercel (web, admin) and Northflank (API), with Neon for Postgres and Brevo for
transactional e-mail.

## What was built

Two-sided marketplace with a separate admin back-office:

- **Clients** browse masters by city and service category, view profiles and reviews, and
  book a time slot against the master's working hours.
- **Masters** manage their public profile, service catalogue, working hours, and incoming
  bookings (confirm / complete / cancel), with e-mail notification at each transition.
- **Admin panel** (separate deployment) for moderating users, bookings, reviews, and the
  service-category tree.

Cross-cutting: e-mail/password and Google OAuth sign-in with e-mail verification and
password reset, JWT auth, rate limiting, a Slovak-language profanity filter on all
user-submitted text, GDPR account deletion, HTML transactional e-mail templates, and a
dynamic `sitemap.xml` covering master profiles and categories for SEO.

## Reviving it

Everything below still works — the setup instructions are current. Clone, follow
[Local development setup](#local-development-setup), and it runs.

## Project structure

```
apps/
  web/          # Angular frontend (port 4200)
  api/          # NestJS backend  (port 3000)
  admin/        # Angular admin panel (port 4201)
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
