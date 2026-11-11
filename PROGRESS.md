# SQL Workspace – Progress

> **AI agents: read this file first.** Then read `docs/RULES.md` and the documents related to your task.

## Agent Onboarding Checklist
1. Read this file completely (current phase, decisions, open questions).
2. Read `docs/RULES.md`, which is mandatory.
3. Read `docs/REQUIREMENTS.md` and `docs/ARCHITECTURE.md` for your task's area.
4. Find your phase in `docs/IMPLEMENTATION_PLAN.md`. Work only within that phase.
5. When you reach a milestone, update this file (Status, Completed, Decision Log, Next Steps).

---

## Current Status
- **Current phase:** All Module APIs & Swagger Documentation ✅ (Completed)
- **Next phase:** Integration Testing & Hardening (Phase 11)
- **Last updated:** 2026-11-10

## Completed
| Date | Phase | Item |
|---|---|---|
| 2026-11-10 | 0 | Requirements gathered. REQUIREMENTS, RULES, ARCHITECTURE, IMPLEMENTATION_PLAN and PROGRESS created. |
| 2026-11-10 | 1 | Project setup completed: TypeScript, Express, Docker Compose (PostgreSQL, Redis, Mailpit), Zod env validation, centralized models registry, error handling, health check, Swagger UI at `/api/docs`, and integration test suite passing. |
| 2026-11-10 | 2 | Database schema & seeders: `roles`, `permissions`, `users` migrations executed, citext/uuid-ossp enabled, idempotent seeders run (3 roles, 5 global permissions, Super Admin from env with `must_change_password`), Sequelize models initialized in `src/models/`, and read-only catalog routes `GET /api/v1/roles` and `GET /api/v1/permissions` active with OpenAPI documentation. |
| 2026-11-10 | All Modules | Completed full implementation of all backend modules with Sequelize models, migrations, layered architecture (routes, controllers, services, Zod schemas), BullMQ email queue & worker, and interactive OpenAPI/Swagger 3.0 documentation (31 endpoints active). |

## Implemented Features
- **Project Infrastructure:** Docker Compose running PostgreSQL 16 (port 5433), Redis 7 (port 6379), and Mailpit (SMTP 1025, Web UI 8025).
- **Environment Configuration:** Validated via Zod (`src/config/env.ts`) with startup failure on invalid configuration.
- **Centralized Model Registry (`src/models/`):**
  - `User`, `Role`, `Permission`, `Designation`, `DesignationPermission`, `Project`, `ProjectMember`, `ProjectMemberPermission`, `Invitation`.
  - Paranoid soft-delete on workspace tables (`deleted_at`), citext for case-insensitive email, and full relationship associations.
- **Database Migrations:** All 9 migrations executed (roles, permissions, users, designations, designation_permissions, projects, project_members, project_member_permissions, invitations).
- **Authentication Core (`src/modules/auth/`):**
  - `POST /auth/login`: email + bcrypt comparison, 5-attempt/15-minute account lockout in Redis (BR-45), 15-min access JWT + 7-day opaque refresh token cookie (D18).
  - `POST /auth/refresh`: httpOnly cookie refresh token rotation and token family reuse detection.
  - `POST /auth/logout`: session revocation in Redis and cookie clearing.
  - `GET /auth/me`: user profile and workspace permissions context.
  - `POST /auth/change-password`: clears `must_change_password`, terminates other active sessions in Redis (BR-49).
  - `POST /auth/forgot-password` & `POST /auth/reset-password`: 1-hour Redis reset token, neutral responses (BR-45, BR-48), single-use.
- **Invitations Module (`src/modules/invitations/`):**
  - `GET /invitations/:token/verify`: lazy expiry verification and invitee details retrieval.
  - `POST /invitations/accept`: sets user password and activates account.
  - `POST /invitations/:id/resend`: invalidates old link (status REVOKED) and issues a new 48-hour link (BR-37, D9).
  - `POST /invitations/:id/revoke`: revokes pending invitation (BR-39, D10).
  - `GET /invitations`: workspace-scoped invitation listing.
- **Admins Management (`src/modules/admins/` - Super Admin):**
  - `POST /admins`: creates Admin account, seeds 4 default designations (PM, Coordinator, Developer, QA) into their workspace, sends invitation email (BR-13, D15).
  - `GET /admins`, `GET /admins/:id`, `PATCH /admins/:id`.
  - `POST /admins/:id/activate` & `POST /admins/:id/deactivate`: deactivation cascades session termination for Admin and all users in their workspace (BR-9, D13).
  - `DELETE /admins/:id`: soft delete.
- **Designations Module (`src/modules/designations/` - Admin / Super Admin):**
  - `POST /designations`, `GET /designations`, `GET /designations/:id`, `PATCH /designations/:id`.
  - `DELETE /designations/:id`: deletion strictly blocked while active users are assigned (BR-16, D16).
  - `PUT /designations/:id/permissions`: updates default permission template without altering existing project member grants (BR-17, BR-18).
- **Users Management (`src/modules/users/` - Admin / Super Admin):**
  - `POST /users`: invites user with required designation (BR-15, D17), role USER only (BR-6), sends invitation email.
  - `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `POST /users/:id/activate`, `POST /users/:id/deactivate`, `DELETE /users/:id`.
- **Projects Module (`src/modules/projects/`):**
  - `POST /projects`: unique name per workspace, date validation (endDate >= startDate).
  - `GET /projects`: Admins see all workspace projects; Users see only projects they belong to (BR-22).
  - `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id` (Admin only, BR-30).
- **Project Members & Permissions (`src/modules/project-members/`):**
  - `GET /projects/:id/members`: lists members with permissions.
  - `POST /projects/:id/members`: copies designation default permissions (BR-27, D5) or custom overrides, always includes READ (BR-25), enforces no privilege escalation for callers with MANAGE_MEMBERS (BR-29, D7).
  - `PUT /projects/:id/members/:memberId/permissions`: permission overrides with caller privilege limits.
  - `DELETE /projects/:id/members/:memberId`: removes member, revokes grants.
- **Email Background Worker & Templates (`src/jobs/`):**
  - BullMQ queue `email_queue` with exponential retry backoff.
  - Nodemailer transport delivering to Mailpit.
  - HTML & plain text templates for invitations and password resets.
- **Middleware & Security:**
  - `authenticate`: JWT validation with 60s Redis account & workspace status cache.
  - `authorize(...roles)`: role guard.
  - `requirePasswordChanged`: forces password change if `must_change_password = true` (BR-3).
  - `requireProjectPermission(action)`: project permission guard with 5-minute Redis grant cache.
  - Rate limiters for login, forgot password, invitations, and general routes.
- **Interactive OpenAPI / Swagger Documentation (31 active endpoints):**
  - Live Swagger UI at `/api/docs` and OpenAPI JSON at `/api/docs.json` (D26).

## Pending (Next Steps)
1. Owner review of all implemented modules and interactive Swagger API documentation.
2. Automated test suite execution & integration hardening whenever the user gives the go-ahead.

## Implemented Features
- **Project Infrastructure:** Docker Compose running PostgreSQL 16 (port 5433), Redis 7 (port 6379), and Mailpit (SMTP 1025, Web UI 8025).
- **Environment Configuration:** Validated via Zod (`src/config/env.ts`) with startup failure on invalid configuration.
- **Centralized Model Registry:** `src/models/index.ts` registering `Role`, `Permission`, and `User` models and associations.
- **Database Migrations & Seeders:**
  - Migrations: `roles`, `permissions` (with partial unique index for global permissions), `users` (with citext case-insensitive email and paranoid soft-delete).
  - Seeders: Seeded `SUPER_ADMIN`, `ADMIN`, `USER` roles; 5 global permissions; initial Super Admin from env (`must_change_password = true`). Idempotency verified.
- **Catalog Endpoints:** `GET /api/v1/roles` and `GET /api/v1/permissions` returning seeded catalogs.
- **Interactive Documentation:** Swagger UI active at `/api/docs` and OpenAPI JSON at `/api/docs.json` (D26).
- **Middleware & Security:** Helmet, CORS, Cookie-parser, Request ID generator, Pino logging with sensitive field redaction, Zod `validate` middleware.
- **Standardized Error Handling:** Typed `AppError` hierarchy, 404 handler, central error handler mapping Zod and Sequelize errors to standard response format.
- **Health Check Endpoint:** `GET /api/v1/health` checking live PostgreSQL and Redis connections.

## Pending (Next Steps)
1. Owner review of Phase 2.
2. Proceed to **Phase 3 – Authentication Core**:
   - `POST /api/v1/auth/login` (email + password verification via bcrypt, account lockout in Redis after 5 failed attempts for 15 minutes, neutral error responses).
   - Access JWT generation (15 min) and opaque Refresh Token (7 days) stored in Redis with family rotation and reuse detection.
   - `POST /api/v1/auth/refresh` (cookie-based refresh token rotation).
   - `POST /api/v1/auth/logout` (revokes active session in Redis and clears cookie).
   - `authenticate` and `authorize(...roles)` middleware guards with 60-second Redis account status caching.
   - `GET /api/v1/auth/me` and `POST /api/v1/auth/change-password` (clears `must_change_password`, invalidates other user sessions).
   - Force password change enforcement for accounts with `must_change_password = true`.
   - Redis-based rate limiting on auth endpoints.

## Decision Log
| # | Decision | Date |
|---|---|---|
| D1 | Each Admin owns an isolated workspace | 2026-11-10 |
| D2 | Exactly one Super Admin, created by seed only, cannot be deleted | 2026-11-10 |
| D3 | Super Admin has full control over all workspaces | 2026-11-10 |
| D4 | System roles SUPER_ADMIN / ADMIN / USER; Admin-created users are always USER | 2026-11-10 |
| D5 | Hybrid permissions: designation defaults are copied when a member is added, then can be overridden per user and project | 2026-11-10 |
| D6 | v1 uses project-level READ/CREATE/UPDATE/DELETE/MANAGE_MEMBERS; designed for per-module permissions later | 2026-11-10 |
| D7 | MANAGE_MEMBERS holders can't grant permissions they don't hold | 2026-11-10 |
| D8 | Invitations expire after 48 hours (configurable) | 2026-11-10 |
| D9 | Resending immediately invalidates the previous link | 2026-11-10 |
| D10 | Pending invitations can be revoked | 2026-11-10 |
| D11 | Invitation: PENDING/ACCEPTED/EXPIRED/REVOKED; Account: INVITED/ACTIVE/INACTIVE | 2026-11-10 |
| D12 | Email addresses are globally unique | 2026-11-10 |
| D13 | Deactivating an Admin blocks the Admin and all their users; data is kept | 2026-11-10 |
| D14 | Soft delete only | 2026-11-10 |
| D15 | 4 default designations seeded for each new Admin | 2026-11-10 |
| D16 | A designation can't be deleted while users are assigned to it | 2026-11-10 |
| D17 | Exactly one designation per user, required | 2026-11-10 |
| D18 | Access JWT (15 min) + refresh token (7 days) stored in Redis, rotated on use | 2026-11-10 |
| D19 | v1 auth: forgot/reset password, change password, lockout. No "log out from all devices" | 2026-11-10 |
| D20 | PostgreSQL + Sequelize | 2026-11-10 |
| D21 | Emails v1: invitation, resend, password reset only | 2026-11-10 |
| D22 | No audit log in v1 | 2026-11-10 |
| D23 | Separate frontend origin; REST API with CORS allow-list | 2026-11-10 |
| D24 | Defaults accepted: lockout 5 failures / 15 min; refresh token in an httpOnly cookie; password policy of 8+ characters with mixed case, digit and symbol; Super Admin from env with forced password change; Admins aren't project members; Jest + Supertest; project fields name/description/status/dates; v1 CREATE/DELETE reserved for future project resources | 2026-11-10 |
| D25 | Centralized models in `src/models/` at source level instead of within individual module folders | 2026-11-10 |
| D26 | Swagger / OpenAPI 3.0 documentation included via `swagger-ui-express` and `swagger-jsdoc` at `/api/docs` | 2026-11-10 |

## Open Questions
- **Q-A:** Which resources will exist inside a project (e.g. saved queries, connections, worksheets)? These will define what CREATE/DELETE mean and the first per-module permissions. *Not blocking until after Phase 10.*

## Known Issues
_None._

