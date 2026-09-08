# CAPACITY CONNECT Backend

<p>
  <strong>Enterprise-grade LMS backend for organizational capacity building.</strong><br>
  Built for secure, role-driven learning, assessments, analytics, and communication.
</p>

<p>
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&amp;logoColor=white">
  <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express&amp;logoColor=white">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&amp;logoColor=white">
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&amp;logoColor=white">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success">
</p>

---

## Overview

CAPACITY CONNECT is a scalable backend platform that powers digital learning operations for institutions and enterprises.  
It centralizes trainee and trainer workflows into one secure system:

- Role-based onboarding with approval lifecycle
- Profile and competency management
- Course publishing and enrollment
- Learning resource delivery through Cloudflare R2
- MCQ and document assessments with submission tracking
- Feedback, notifications, announcements, and achievements
- Dashboard APIs for role-specific analytics
- Internal direct messaging for platform users

---

## Core Product Capabilities

### Identity & Access
- JWT-based authentication (`/register`, `/login`, `/me`)
- Role-based access control for `TRAINEE`, `TRAINER`, and `ADMIN`
- Approval workflow with user statuses (`PENDING`, `APPROVED`, etc.)
- Rate limiting and secure middleware defaults via Helmet + CORS

### Learning Lifecycle
- Subject and competency catalog
- Course creation, publishing, trainer collaboration, and invitations
- Enrollment lifecycle management
- Resource upload + secure access links from object storage

### Assessment & Performance
- MCQ and document assessment support
- Attempt submission, auto/manual evaluation modes, and result controls
- Trainer/trainee/admin performance views and dashboard endpoints

### Engagement & Communication
- Course, trainer, resource, and assessment feedback APIs
- Admin announcements and achievement publishing
- Notification center with read/unread state
- Direct messaging and conversation threading

---

## Architecture

```text
Client Applications (Web/Mobile)
          │
          ▼
     Express API
          │
   ┌──────┴─────────┐
   ▼                ▼
PostgreSQL       Cloudflare R2
(Prisma ORM)     (Learning assets)
```

Codebase style follows a feature-first layout:

```text
src/
├── features/        # Auth, users, courses, assessments, feedback, etc.
├── middleware/      # Auth, RBAC, validation, error handling, rate limiting
├── config/          # Environment and runtime configuration
├── database/        # Prisma client wiring
├── utils/           # Shared helpers
├── app.js           # App composition and route mounting
└── server.js        # Runtime entrypoint
```

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Storage:** Cloudflare R2 (S3-compatible)
- **Validation:** Zod
- **Security:** Helmet, CORS, JWT, express-rate-limit
- **Logging:** Pino

---

## Quick Start

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create a `.env` file in the repository root using the required keys:

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | API port (e.g. `4000`) |
| `NODE_ENV` | Yes | Runtime environment (`development`, `production`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing auth tokens |
| `R2_ENDPOINT` | Yes | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | Yes | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret key |
| `R2_BUCKET` | Yes | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Yes | Public base URL for served files |
| `CORS_ORIGIN` | Yes | Allowed frontend origin |
| `RATE_LIMIT_WINDOW_MS` | Yes | Rate limit window in ms |
| `RATE_LIMIT_MAX` | Yes | Max requests per window |
| `ADMIN_EMAIL` | Optional | Optional bootstrap/admin usage |
| `ADMIN_PASSWORD` | Optional | Optional bootstrap/admin usage |
| `OPENAI_API_KEY` | Optional | Enables AI-related endpoints/features |
| `OPENAI_BASE_URL` | Optional | Custom OpenAI-compatible base URL |
| `OPENAI_MODEL` | Optional | Model override (default: `gpt-4o-mini`) |

### 3) Prepare database
```bash
npm run db:generate
npm run db:migrate
```

### 4) Run in development
```bash
npm run dev
```

Health check:
```bash
GET /health
```

---

## NPM Scripts

| Script | Purpose |
|---|---|
| `npm run start` | Start production server |
| `npm run dev` | Start development server with watch mode |
| `npm run lint` | Run ESLint on `src/` |
| `npm run db:migrate` | Run Prisma dev migrations |
| `npm run db:deploy` | Apply migrations in deployment environments |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

---

## API Surface (Module-Level)

Route modules currently include:

- Authentication
- Users
- Profiles
- Certifications
- Subjects
- Courses
- Enrollments
- Resources
- Assessments
- Dashboard
- Notifications
- Announcements
- Achievements
- Feedback
- Competencies
- Messages (`/messages`)

---

## Deployment Notes

This repository includes production-oriented deployment assets:

- `deploy.sh` for EC2 + PM2 rollout flow
- `ecosystem.config.js` for PM2 process management
- `nginx.conf.example` as reverse-proxy reference

Typical deployment flow:
1. Pull latest changes
2. Install dependencies
3. Apply Prisma migrations
4. Generate Prisma client
5. Restart PM2 process

---

## Contributing

1. Create a feature branch
2. Keep changes scoped and modular by feature
3. Run lint and verify migrations before opening a PR
4. Include API and schema updates in the same change when needed

---
