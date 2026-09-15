# FlowForge — Multi-Tenant Project Management SaaS

FlowForge is a full-stack multi-tenant project management SaaS platform. It lets organizations (tenants / workspaces) manage projects, tasks, time logs, reports, notifications, billing, and team collaboration from a single React frontend backed by an Express + MongoDB API.

## ✨ Features

- **Multi-tenant workspaces** — each workspace is an isolated tenant with its own members, projects, and data
- **Authentication & Authorization**
  - Email signup / login with JWT access + refresh tokens
  - Google OAuth 2.0 (SPA token-exchange flow)
  - Password reset & invite-acceptance flows
  - Role-based access control (`owner`, `admin`, `member`, `viewer`) via `verifyToken` and `checkRole` middleware
- **Projects & Tasks** — full CRUD, task comments, status tracking, file attachments
- **Time tracking** — start / stop / active timers, per-user and per-task logs
- **Reports & Analytics** — work summary, workload, 30-day completion trends, overdue tasks
- **Notifications** — in-app notification system with read/unread state
- **Calendar integration** — ICS feed generation + task/project exports
- **Slack integration** — webhook save / test / remove
- **Billing (Stripe)** — subscription plans, checkout, billing portal, usage limits
- **Automation** — scheduled jobs for due date & project deadline reminders
- **AI assistant** — AI-powered task/management help endpoint
- **Rate limiting, Helmet security headers, CORS**

## 🏗 Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Redux Toolkit, TanStack Query, React Router |
| Backend  | Node.js, Express 5, Mongoose 9, Passport.js (Google OAuth) |
| Database | MongoDB (via Mongoose ODM) |
| Payments | Stripe |
| Email    | Resend |
| Other    | node-cron (jobs), zod (validation), JWT auth |

## 📁 Project Structure

```
FlowForge-Multi-Tenant-Project-Management-SaaS/
├── client/                # React + Vite frontend
│   └── src/
├── server/                # Express backend
│   ├── config/            # DB + passport config
│   ├── controllers/       # Route handlers
│   ├── jobs/              # Scheduled automation jobs
│   ├── middleware/        # Auth, tenant scoping, role checks
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API route definitions
│   ├── services/          # Stripe, calendar, email, etc.
│   └── utils/             # Helpers & response utilities
├── AUTH_FLOW_DOCUMENTATION.md
├── API_REFERENCE.md
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm (or bun for the client)
- MongoDB instance (local or Atlas)
- Google OAuth credentials, Stripe keys, Resend API key (only if using those integrations)

### 1. Setup the server

```bash
cd server
cp .env.example .env   # then fill in your environment variables
npm install
```

### 2. Setup the client

```bash
cd client
cp .env.example .env   # then fill in your environment variables
npm install
```

### 3. Run locally

```bash
# Terminal 1 — backend
cd server
npm run dev            # or npm start

# Terminal 2 — frontend
cd client
npm run dev
```

- Backend: `http://localhost:5000`
- Health check: `GET /api/health`
- Frontend: the URL printed by Vite (default `http://localhost:5173`)

## 🔑 Environment Variables

### Server (`server/.env`)

```
PORT=5000
MONGODB_URI=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...
FRONTEND_URL=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
```
See `server/.env.example` for the full list.

### Client (`client/.env`)

See `client/.env.example` for the full list.

## 📚 Documentation

- [API Reference](API_REFERENCE.md) — all backend endpoints
- [Authentication & Workspace Setup Flow](AUTH_FLOW_DOCUMENTATION.md) — detailed auth flow write-up

## 🧪 Tests

The frontend uses **Vitest** (unit) and **Playwright** (E2E):

```bash
cd client
npm run test          # vitest watch mode
npm run test:run      # one-shot unit tests
npm run e2e           # playwright tests
```

## 🗄 Database Cleanup

To reset all user data for testing:

```bash
cd server
node cleanup.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Push and open a pull request

## 📄 License

ISC