![AutoLog logo](frontend/public/android-chrome-192x192.png)

# AutoLog

**A free car maintenance and fuel log.**
Track fill-ups, service history, costs and receipts for all your vehicles, and share them with a link.

**[Live app → autolog.cc](https://autolog.cc)**

![Frontend CI](https://github.com/hofnarrxx/auto-log/actions/workflows/frontend-ci.yml/badge.svg)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4-6DB33F?logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)

![AutoLog preview](frontend/public/og-image.png)

---

## Features

- **Multiple vehicles** – keep a profile for every car you own.
- **Fuel log** – record fill-ups and see totals, average consumption, mileage warnings and the latest odometer reading.
- **Maintenance history** – log services by category and attach invoices and receipts.
- **Server-side pagination, sorting and filtering** – lists stay fast no matter how many records you have, and summaries are computed over the whole history, not just the visible page.
- **Public share links** – give a mechanic or a buyer a read-only view of a vehicle's fuel and maintenance history, without needing an account.
- **Flexible sign-in** – email and password with email verification and password reset, or Google sign-in (accounts can be linked).
- **Demo mode** – try the app without creating an account.
- **Multi-language UI** – English, Polish and Ukrainian.
- **Multi-currency** support for costs.

## Tech stack

| Layer          | Technology                                                                          |
| -------------- | ----------------------------------------------------------------------------------- |
| Frontend       | Angular 21 (standalone components, signals), TypeScript, RxJS, ngx-translate        |
| Backend        | Spring Boot 4, Java 21, Spring Security (JWT + Google OAuth2), Spring Data JPA      |
| Database       | PostgreSQL with Flyway migrations                                                   |
| File storage   | Cloudflare R2 (S3-compatible) via pre-signed upload/download URLs                   |
| Email          | SMTP (verification and password-reset emails)                                       |
| Rate limiting  | Bucket4j + Caffeine                                                                 |
| Infrastructure | Docker Compose, Caddy (automatic HTTPS)                                             |
| CI             | GitHub Actions (format, lint, type-check, i18n check, unit tests, production build) |

## Repository layout

```text
auto-log/
├── backend/    Spring Boot REST API (controllers, services, repositories, Flyway migrations)
├── frontend/   Angular single-page app (see frontend/README.md for architecture notes)
├── deploy/     Docker Compose stack, Caddyfile and .env.example for production
└── .github/    CI workflows
```

## Getting started

### Prerequisites

- Java 21
- Node.js 24 and npm
- A PostgreSQL database
- A Cloudflare R2 (or other S3-compatible) bucket, SMTP credentials and a Google OAuth client

### 1. Backend

The backend reads its configuration from environment variables. For local development, put them in `backend/.env` (loaded automatically by `application.yml`):

```properties
# Database
DB_URL=jdbc:postgresql://localhost:5432/autolog
DB_USER=autolog
DB_PASS=change-me

# Auth
JWT_SECRET=<long random string, e.g. `openssl rand -hex 32`>
CLIENT_ID=<google oauth client id>
CLIENT_SECRET=<google oauth client secret>

# Object storage (Cloudflare R2)
R2_ENDPOINT=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=
R2_REGION=auto

# Email
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM="AutoLog <noreply@example.com>"

# Demo accounts (required by application.yml)
DEMO_LOGIN_EN=demo-en@autolog.app
DEMO_LOGIN_PL=demo-pl@autolog.app
DEMO_LOGIN_UK=demo-uk@autolog.app
```

Optional variables: `FRONTEND_URL` (default `http://localhost:4200`) and `COOKIE_SECURE` (default `false`).

Then start the API on `http://localhost:8080`:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell, use `.\mvnw.cmd spring-boot:run`. Database migrations are applied automatically by Flyway on startup.

### 2. Frontend

```bash
cd frontend
npm ci
npm start
```

The app is served at [http://localhost:4200](http://localhost:4200). The development build expects the API at `http://localhost:8080`.

## Development

Run the full frontend quality gate (the same steps CI runs) from `frontend/`:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run i18n:check
npm run test:ci
npm run build:prod
```

Translations live in `frontend/public/i18n/{en,pl,uk}.json`; `npm run i18n:check` verifies the key sets match.

Backend tests:

```bash
cd backend
./mvnw test
```

Frontend architecture, dependency rules and conventions are documented in `[frontend/README.md](frontend/README.md)`.

## Security notes

- Passwords are hashed; sessions use short-lived JWT access tokens with refresh tokens.
- Authentication and public endpoints are rate limited.
- Attachments and images are uploaded directly to object storage through pre-signed URLs.
