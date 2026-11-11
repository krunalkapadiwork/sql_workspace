# SQL Workspace – AI Development Rules

> Every AI agent (and human) working on this codebase **must** follow these rules. If a rule conflicts with a request, stop and ask the project owner.

---

## 1. Before You Start Any Task
1. Read `PROGRESS.md` to see the current phase, the decisions made so far, and the open questions.
2. Read the parts of `REQUIREMENTS.md`, `ARCHITECTURE.md` and `IMPLEMENTATION_PLAN.md` that relate to your task.
3. Look at the existing code in the affected modules and **follow the patterns already in use**.
4. Work only within the current phase. Don't start the next phase until the owner confirms the current one is complete.

## 2. Decision-Making
- **Never assume.** If a requirement is unclear or missing, ask the owner and wait for an answer.
- **Never silently change** an approved business rule (`BR-n`) or decision (`Dn`). Propose the change, explain why, and wait for approval.
- When there are several reasonable options, present them with their pros and cons and recommend one. The owner decides.
- Record every new decision in the `PROGRESS.md` Decision Log.

## 3. Scope and Simplicity
- Build only what the current task needs. Avoid speculative features, premature optimization and abstractions with only one implementation.
- **No new dependencies** unless the owner approves them. Prefer what's already in `ARCHITECTURE.md` §2.
- Don't duplicate code. If logic is needed in two places, move it into `src/common/` or a shared service.
- Keep functions short and focused, ideally under about 40 lines. A file over about 300 lines is a sign it should be split.

## 4. TypeScript and Naming
- Use `strict` mode. **No `any`**: use `unknown` and narrow it. Never use `@ts-ignore` unless there's a comment explaining why.
- Prefer `const`. Use `async/await` rather than raw promise chains.

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case + role suffix | `user.service.ts`, `auth.routes.ts` |
| Classes, types, interfaces, enums | PascalCase | `UserService`, `InvitationStatus` |
| Variables, functions | camelCase | `findActiveUser` |
| Constants and env vars | UPPER_SNAKE_CASE | `INVITE_TTL_HOURS` |
| DB tables and columns | snake_case, plural tables | `project_members.user_id` |
| API paths | kebab-case, plural nouns | `/api/v1/project-members` |

- Use named exports only (no default exports).
- Import modules through their public surface (`modules/<name>/index.ts`), not their internal files.

## 5. Layering (mandatory)
`routes → middleware (auth, validate) → controller → service → model`
- **Routes:** wire paths to middleware and controllers. They contain no logic.
- **Controllers:** read validated input, call one service method, and send the response. They contain no business logic and no database access.
- **Services:** hold all business rules and own transactions. They must not touch `req` or `res`.
- **Models:** centralized in `src/models/`. Sequelize definitions, relationships, and associations only. They contain no business logic. Modules import models from `src/models`.
- Jobs and workers call services. They never duplicate service logic.

## 6. Validation
- Every request body, param and query string is validated with a **Zod** schema (`*.schema.ts`) by the `validate` middleware **before** the controller runs.
- Use the parsed (validated) output, never raw `req.body`.
- Unknown fields are stripped. Strings are trimmed. Emails are lower-cased.
- Environment variables are validated with Zod at startup. The app refuses to start if any are invalid.

## 7. Error Handling
- Throw typed errors that extend `AppError` (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `TooManyRequestsError`).
- Don't use `try/catch` in controllers just to re-send errors. Async errors go to the central error handler.
- Never expose stack traces, SQL or internal messages to clients. Every error response uses the shape defined in `ARCHITECTURE.md` §6.
- Return 404 (not 403) for resources in another workspace, so their existence isn't revealed.

## 8. Security (non-negotiable)
- **Tenant scoping:** every query on workspace data must filter by `workspace_id` (`admin_id`), which comes from the authenticated user and **never** from client input. The only exception is Super Admin endpoints that are explicitly designed to work across workspaces.
- **Authorization:** every route other than public auth endpoints must use `authenticate` and the appropriate role or permission guard. Default to denying access.
- Passwords are hashed with bcrypt (cost factor from config). Invitation and reset tokens are stored only as **SHA-256 hashes**.
- Never log passwords, tokens, secrets or full request bodies on auth routes.
- Use only Sequelize's parameterized APIs. Raw SQL requires replacements or bind parameters, and must be justified in a comment.
- Secrets come only from environment variables. Never commit `.env`; keep `.env.example` updated.
- Compare tokens and secrets with timing-safe methods. Auth responses must not reveal whether an account exists.

## 9. Database
- Schema changes happen **only through migrations**. Never call `sequelize.sync()` outside tests.
- Seeders must be idempotent, meaning safe to run more than once.
- Any operation that writes more than one row or table runs inside a **transaction**.
- Soft delete uses Sequelize `paranoid` (`deleted_at`). Uniqueness rules must ignore soft-deleted rows where the requirements say so (use partial unique indexes).
- Every foreign key has an index. Use UUID primary keys.
- Avoid N+1 queries: use `include` or batch queries, and paginate every list endpoint.

## 10. API Conventions & Documentation
- Follow `ARCHITECTURE.md` §6 exactly: base path, response envelope, pagination parameters and status codes.
- Never return password hashes, token hashes or internal flags. Serialize through explicit DTO or mapper functions.
- Every route and schema must maintain Swagger / OpenAPI annotations so that `/api/docs` stays completely synchronized with implementation.

## 11. Testing
- Every feature includes tests:
  - Unit tests for service rules.
  - Integration tests (Supertest) for each endpoint, including authorization and tenant-isolation cases.
- A phase is complete only when `npm run lint`, `npm run typecheck` and `npm test` all pass.
- Tests must not depend on each other or on external email or Redis services that tests don't control.

## 12. Documentation and Progress
- Update `PROGRESS.md` after each meaningful milestone. Record completed work, decisions, known issues and the next step.
- If behavior changes with approval, update `REQUIREMENTS.md` or `ARCHITECTURE.md` in the same change.
- Explain non-obvious code with short comments that say *why*, not *what*. Keep existing comments.
- Summarize important implementation decisions to the owner in plain language.

## 13. Agents Must NOT
- Write application code before the relevant phase has been approved.
- Add dependencies, change the folder structure or change the tech stack without approval.
- Disable lint rules, type checks or tests to make a build pass.
- Commit secrets, generated files or `node_modules`.
- Change or delete existing migrations that have already been applied. Add a new migration instead.
- Refactor unrelated code as part of a task.

