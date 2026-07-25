# Auto Log

Full-stack vehicle log application with authenticated vehicle, fuel, maintenance, attachment, and public sharing workflows.

## Technology

- Backend: Spring Boot 4, Java 21, Spring Security, JPA, and PostgreSQL
- Frontend: Angular 21, TypeScript, signals, RxJS, and ngx-translate

## Run locally

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell, run `.\mvnw.cmd spring-boot:run`.

Backend configuration lives in `backend/src/main/resources/application.yml`.

### Frontend

```bash
cd frontend
npm ci
npm start
```

The frontend is served at `http://localhost:4200` and currently expects the API at `http://localhost:8080`.

## Verification

Run frontend checks from `frontend/`:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run i18n:check
npm run test:ci
npm run build:prod
```

Frontend-specific architecture and development guidance is in `frontend/README.md`.
 
