# Registra

<a name="readme-top"></a>

## 📗 Table of Contents

- [📖 About the Project](#about-project)
  - [🛠 Built With](#built-with)
    - [Tech Stack](#tech-stack)
    - [Key Features](#key-features)
  - [🚀 Live Demo](#live-demo)
- [💻 Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Install](#install)
  - [Usage](#usage)
  - [Run tests](#run-tests)
  - [Deployment](#deployment)
- [🔭 Future Features](#future-features)
- [🤝 Contributing](#contributing)
- [⭐️ Show your support](#support)
- [🙏 Acknowledgements](#acknowledgements)
- [❓ FAQ](#faq)
- [📝 License](#license)

---

## 📖 Registra <a name="about-project"></a>

**Registra** is a multi-tenant SaaS school management platform purpose-built for Nigerian schools. Each school operates on its own isolated subdomain (e.g. `schoolname.myregistra.net`) with independent data, branding, and configurable feature access. Schools subscribe to plans that unlock specific modules — from grading and bursary to HR, transport, and a full LMS.

([back to top](#readme-top))

---

## 🛠 Built With <a name="built-with"></a>

### Tech Stack <a name="tech-stack"></a>

<details>
  <summary>Client</summary>
  <ul>
    <li><a href="https://nextjs.org/">Next.js 16</a></li>
    <li><a href="https://react.dev/">React 19</a></li>
    <li><a href="https://www.typescriptlang.org/">TypeScript 5.8</a></li>
    <li><a href="https://tailwindcss.com/">Tailwind CSS 4.1</a></li>
    <li><a href="https://zustand-demo.pmnd.rs/">Zustand 5</a></li>
    <li><a href="https://tanstack.com/query">TanStack React Query 5</a></li>
    <li><a href="https://react-hook-form.com/">React Hook Form + Zod</a></li>
    <li><a href="https://www.framer.com/motion/">Framer Motion</a></li>
  </ul>
</details>

<details>
  <summary>Server</summary>
  <ul>
    <li><a href="https://www.djangoproject.com/">Django 6</a></li>
    <li><a href="https://www.django-rest-framework.org/">Django REST Framework 3.15</a></li>
    <li><a href="https://docs.celeryq.dev/">Celery 5</a> (worker + beat)</li>
    <li><a href="https://gunicorn.org/">Gunicorn</a></li>
    <li><a href="https://traefik.io/">Traefik</a> (reverse proxy + TLS)</li>
    <li><a href="https://docs.sentry.io/">Sentry</a> (error tracking)</li>
  </ul>
</details>

<details>
  <summary>Database</summary>
  <ul>
    <li><a href="https://www.postgresql.org/">PostgreSQL 15</a> (primary + streaming replica)</li>
    <li><a href="https://www.pgbouncer.org/">PgBouncer</a> (connection pooling)</li>
    <li><a href="https://redis.io/">Redis 7</a> (cache + Celery broker)</li>
    <li><a href="https://developers.cloudflare.com/r2/">Cloudflare R2</a> (file storage)</li>
  </ul>
</details>

([back to top](#readme-top))

### Key Features <a name="key-features"></a>

- **Multi-tenant isolation** — Each school operates on its own subdomain with fully isolated data, settings, and user accounts. Custom domains are also supported.
- **24 subscription-gated modules** — Students, grading, bursary, HR & payroll, LMS/CBT, transport, library, inventory, analytics, and more — all togglable per school plan.
- **Nigerian school-first design** — Built around Nigerian exam weights (CA1/CA2/Exam), Paystack & Flutterwave payments, WAEC/NECO fields, PTA fees, PFA pension tracking, and early-years report cards.

([back to top](#readme-top))

---

## 🚀 Live Demo <a name="live-demo"></a>

- [myregistra.net](https://myregistra.net)

([back to top](#readme-top))

---

## 💻 Getting Started <a name="getting-started"></a>

To get a local copy up and running, follow these steps.

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker Desktop

### Setup

Clone this repository to your desired folder:

```bash
git clone https://github.com/your-username/registra.git
cd registra
```

Copy the environment file and fill in the required values:

```bash
cp .env.example .env.local
```

Key variables to set in `.env.local`:

```bash
# Django
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgres://registra_admin:registra_secure_pass_2026@localhost:5436/registra_db
REDIS_URL=redis://localhost:6381/0
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Next.js
NEXT_PUBLIC_ROOT_DOMAIN=localhost
DJANGO_API_URL=http://127.0.0.1:8001

# File storage (Cloudflare R2 or AWS S3)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Rate limiting (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Install

Start the local infrastructure (PostgreSQL on `:5436`, Redis on `:6381`):

```bash
npm run docker:up
```

Install frontend dependencies:

```bash
npm install
```

Set up the Python backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
```

### Usage

Start both the frontend and backend together:

```bash
npm run local
```

Or start them separately:

```bash
# Terminal 1 — Django backend
npm run backend

# Terminal 2 — Next.js frontend
npm run dev
```

The app runs at `http://localhost:3000`.

To test multi-tenancy locally, add an entry to `/etc/hosts`:

```text
127.0.0.1  schoolname.localhost
```

Then visit `http://schoolname.localhost:3000`.

### Run tests

Run frontend unit tests:

```bash
npm run test:run
```

Run TypeScript type checks:

```bash
npm run check-types
```

Run linter:

```bash
npm run lint
```

### Deployment

The production stack runs on **Coolify** with Docker Compose and Traefik handling HTTPS and routing.

```bash
# Deploy updates to a running Coolify instance
npm run deploy:update

# Or bring up the full production stack manually
docker compose -f docker-compose.yaml up -d
```

The production compose starts 8 services: `frontend`, `backend`, `db`, `db_replica`, `pgbouncer`, `redis`, `celery_worker`, and `celery_beat`.

([back to top](#readme-top))

---

## 🔭 Future Features <a name="future-features"></a>

- **Mobile app** — React Native companion app for parents and students
- **WhatsApp/SMS integration** — Push announcements and fee reminders directly to parents' phones
- **Advanced analytics** — AI-powered student performance forecasting and early intervention alerts

([back to top](#readme-top))

---

## 🤝 Contributing <a name="contributing"></a>

Contributions, issues, and feature requests are welcome!

Feel free to check the [issues page](../../issues/).

([back to top](#readme-top))

---

## ⭐️ Show your support <a name="support"></a>

If you find this project useful, give it a ⭐️ — it helps other Nigerian school administrators discover it.

([back to top](#readme-top))

---

## 🙏 Acknowledgements <a name="acknowledgements"></a>

- Inspired by the operational pain points of Nigerian private school administrators
- Built with the [Django REST Framework](https://www.django-rest-framework.org/) and [Next.js](https://nextjs.org/) communities in mind

([back to top](#readme-top))

---

## ❓ FAQ <a name="faq"></a>

- **Can one school's data be seen by another school?**

  - No. Every database query is scoped to the tenant resolved from the request. There is no shared data layer between tenants.

- **How do I add a new school to the platform?**

  - Schools self-register through the `/onboarding` page, pick a plan, choose a subdomain, and are provisioned instantly. No manual setup is required.

([back to top](#readme-top))

---

## 📝 License <a name="license"></a>

This project is [MIT](./LICENSE) licensed.

([back to top](#readme-top))
