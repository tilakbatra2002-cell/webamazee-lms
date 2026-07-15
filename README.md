# Webamazee Lead Management System

A multi-tenant MERN application that scrapes Google Maps for business leads, analyzes their
websites, and manages the full outreach → pipeline → proposal → revenue workflow.

Built for **Webamazee**, but architected so any number of agencies (tenants) can run on the
same deployment with fully isolated data.

---

## 1. Architecture

```
webamazee-lms/
├── backend/           Node.js + Express + MongoDB (Mongoose) + Socket.IO
│   ├── server.js
│   └── src/
│       ├── config/         DB connection
│       ├── models/         Company, User, Lead, ScrapeJob, Meeting, Proposal, FollowUp
│       ├── middleware/      auth (JWT + tenant scoping), upload, error handling
│       ├── controllers/     one per resource
│       ├── routes/
│       └── utils/           Google Maps scraper, website analyzer, job control, email, seed
└── frontend/          React 18 + Vite + Tailwind CSS
    └── src/
        ├── api/             axios instance, endpoint functions, socket.io client
        ├── context/          Auth + Theme (dark/light) context
        ├── components/       Sidebar, Topbar, layout, shared UI kit
        └── pages/            Login, Register, Dashboard, Leads, Scraper, Pipeline,
                               FollowUps, Meetings, Proposals, Analytics, Users, Settings
```

### Multi-tenancy model

- **`Company`** is the tenant root. Every other collection (`User`, `Lead`, `ScrapeJob`,
  `Meeting`, `Proposal`, `FollowUp`) stores a `company` ObjectId reference and has a
  compound index starting with `company` for fast, isolated queries.
- **`User.email` is unique per company, not globally** — two different agencies can both
  have an `admin@gmail.com` user without conflict. Login therefore requires a `companySlug`
  in addition to email + password.
- The JWT only encodes the user id. On every request, `middleware/auth.js` loads the user,
  resolves their `company`, and sets `req.companyId`. **Every controller query is filtered
  by `req.companyId`** — there is no code path where a tenant can see another tenant's data.
- Socket.IO progress events are broadcast to a `company:<id>` room only, so live scraper
  progress never leaks across tenants.
- Adding a new tenant requires zero schema changes — just call
  `POST /api/auth/register-company`, or run the seed script for the first one.

---

## 2. Prerequisites

- Node.js 18+
- A MongoDB database — either local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- (For the scraper) enough RAM/CPU to run headless Chrome — 1GB+ recommended

---

## 3. Backend Setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, SMTP_* (optional for email sending)
npm install
npm run dev          # nodemon, http://localhost:5000
```

`npm install` will also download a bundled Chromium for Puppeteer (used by the scraper).
This requires normal outbound internet access on your machine — it is **not** something you
need to configure separately.

### Bootstrap the first tenant (Webamazee)

```bash
npm run seed
```

This creates the `webamazee` company (slug) and an admin user using the `SEED_*` values in
`.env` (defaults: `admin@webamazee.com` / `Admin@12345`). You can also just use the
**Create your company workspace** screen in the frontend instead of seeding.

---

## 4. Frontend Setup

```bash
cd frontend
cp .env.example .env      # defaults already point at localhost:5000 via the Vite proxy
npm install
npm run dev                # http://localhost:5173
```

Vite is configured to proxy `/api`, `/uploads`, and `/socket.io` to `http://localhost:5000`
in development, so the two `.env` files rarely need editing locally.

---

## 5. Using the app

1. Go to `http://localhost:5173/register` and create a company workspace (or log in with the
   seeded Webamazee admin).
2. **Scraper** page → enter a keyword (e.g. "gyms"), a location (e.g. "Mohali, Punjab"), and a
   max lead count → Start Scraping. Progress streams live via Socket.IO. Each result is
   automatically deduplicated, website-analyzed, and scored for priority.
3. **Leads** page → filter, search, bulk-assign/delete, or open a lead to send WhatsApp
   (click-to-chat), send email, log calls, book meetings, and track its activity timeline.
4. **Pipeline** page → drag leads between stages (New Lead → ... → Won/Lost). Stages are
   configurable per-tenant in **Settings → Pipeline Stages**.
5. **Meetings**, **Proposals** (with PDF upload/download), **Follow-ups**, **Analytics**, and
   **Users** (admin-only) round out the workflow.

---

## 6. Important operating notes

- **Google Maps scraping and Google's Terms of Service.** This scraper drives a real headless
  Chrome session against Google Maps' public search UI. That is a grey area under Google's
  Terms of Service, which generally prohibit automated scraping of their properties. Use
  modest volumes, add delays between jobs, and treat this as an internal tool rather than a
  public-facing or high-volume service. This is a business/legal decision for you to own —
  nothing here is legal advice.
- **Email sending** uses SMTP via Nodemailer (works with Gmail App Passwords, Zoho, SendGrid
  SMTP, etc. — set `SMTP_*` in `backend/.env`). Nothing is sent until you configure real
  credentials.
- **WhatsApp** uses `wa.me` click-to-chat links (no WhatsApp Business API integration, which
  requires a paid Meta Business account you'd need to set up separately). Clicking "Open
  WhatsApp" on a lead opens a pre-filled chat in WhatsApp Web/App.
- **Scrape resume** works in-memory while the backend process is alive (pause/resume is
  instant). If the server restarts mid-job, "Resume" starts a new continuation job for the
  remaining lead count rather than resuming the exact same browser session.

---

## 7. Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build      # outputs dist/
```
Push to a Git repo and import into Vercel, or run `vercel --prod`. Set the environment
variable `VITE_API_URL` to your deployed backend's `/api` URL (e.g.
`https://api.yourdomain.com/api`) and `VITE_SOCKET_URL` to the backend's root URL.

### Backend → Render
- New Web Service → connect repo → root directory `backend`
- Build command: `npm install`
- Start command: `npm start`
- Add all variables from `.env.example` in the Render dashboard (use your MongoDB Atlas URI)
- Render's free/standard instances support Puppeteer, but scraping is CPU/RAM heavy — a
  paid instance (1GB+ RAM) is recommended for reliable scrape jobs.

### Backend → Hostinger VPS (Docker)
See `docker-compose.yml` and `backend/Dockerfile` in this repo. On the VPS:
```bash
git clone <your-repo> && cd webamazee-lms
cp backend/.env.example backend/.env   # edit with production values
docker compose up -d --build
```
This runs the API behind Nginx-free direct exposure on the port defined in `.env` — put your
own Nginx/Caddy reverse proxy + TLS (Let's Encrypt/Certbot) in front of it for a public domain.
Puppeteer's system Chromium dependencies are already installed in the backend image (see
Dockerfile comments) so scraping works out of the box in the container.

### Database → MongoDB Atlas
Create a free M0 cluster, add your server's IP (or `0.0.0.0/0` for Render/Vercel's dynamic
IPs) to the Network Access list, and use the connection string as `MONGO_URI`.

---

## 8. Scripts reference

| Location  | Command         | Description                              |
|-----------|-----------------|-------------------------------------------|
| backend   | `npm run dev`   | Start API with nodemon (auto-restart)     |
| backend   | `npm start`     | Start API for production                  |
| backend   | `npm run seed`  | Bootstrap the first tenant + admin user    |
| frontend  | `npm run dev`   | Vite dev server with HMR                   |
| frontend  | `npm run build` | Production build → `frontend/dist`         |
| frontend  | `npm run preview` | Preview the production build locally     |

---

## 9. Tech stack

**Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcryptjs, Socket.IO, Puppeteer,
Nodemailer, Multer, express-rate-limit, express-async-handler

**Frontend:** React 18, Vite, Tailwind CSS, React Router v6, TanStack Query, React Hook Form,
Axios, Socket.IO client, Recharts, @hello-pangea/dnd (Kanban drag-and-drop), lucide-react,
react-hot-toast
