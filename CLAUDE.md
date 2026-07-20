# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A **Rails 8.1 API-only** application (Ruby 3.4.7, PostgreSQL) with a **React 19 + Webpack** frontend (plain JavaScript/JSX, no TypeScript). It serves a versioned Tasks CRUD API under `/api/v1/tasks`, consumed by a React UI that lists, creates, toggles, and deletes tasks. Both sides are fully tested (RSpec request/model specs; Jest + React Testing Library component tests). Development/testing use only — it will not be deployed anywhere.

## Commands

Run everything through the binstubs in `bin/` (they handle Bundler):

- `bin/setup` — install gems and prepare the database (add `--skip-server` to not boot the app afterward)
- `bin/dev` — start both dev servers via Foreman (`Procfile.dev`: Rails API on :3000, webpack frontend on :5173). Checks PostgreSQL is reachable first (`pg_isready`, with a Postgres.app fallback path) and installs foreman on demand.
- `bin/rails console` / `bin/rails db:migrate` / `bin/rails db:prepare` — usual Rails tasks
- `bin/rspec` — run the backend test suite (19 examples)
  - Single file: `bin/rspec spec/requests/api/v1/tasks_spec.rb`; single example: append `:42`
- `npm test` — run the frontend test suite (Jest + RTL, 24 tests; `npm run test:watch` for watch mode)
- `npm run build` / `npm run dev` — webpack production build / dev server alone (both proxy `--config frontend/webpack.config.js`)
- `bin/rubocop` — lint (rubocop-rails-omakase; config in `.rubocop.yml`)
- `bin/brakeman` / `bin/bundler-audit` — security static analysis / gem CVE audit

CI (`.github/workflows/ci.yml`) runs Brakeman, bundler-audit, RuboCop, and RSpec (`test` job: `postgres:17` service; `DATABASE_URL` supplies host/credentials only, so the database name still comes from `config/database.yml`, and job-level `RAILS_ENV=test` is required for that merge) on PRs and pushes to `main`. **Jest still doesn't run in CI** — add a Node job if the frontend suite should gate CI. `bin/ci` mirrors the Ruby-side steps locally, including `bin/rspec`.

### Environment quirks

- **Ruby via RVM**: non-login shells may default to an old Ruby (3.0.0) and fail on the Bundler version. Prefix commands with `source ~/.rvm/scripts/rvm && rvm use 3.4.7` when binstubs fail that way; `.ruby-version` pins 3.4.7 for shells with RVM integration.
- **PostgreSQL**: a locally installed server on the default unix socket, default role (= OS user). Databases are `test_rails_app_development` / `_test`; `bin/rails db:prepare` creates and migrates both. If specs abort with `PG::ConnectionBad`, the server is down — that is an environment problem, not a code bug.

## Architecture

- **API-only mode**: `config.api_only = true`; `ApplicationController < ActionController::API`. No views, assets, or session/cookie middleware — add middleware back explicitly if needed.
- **Testing**: RSpec + FactoryBot (factories in `spec/factories/`). Generators skip view/helper/routing specs. `.rspec` only requires `spec_helper` — specs touching Rails must `require "rails_helper"` themselves.
- **Solid trifecta**: cache/queue/cable are database-backed (`db/*_schema.rb`); separate databases in production (`config/database.yml`).
- **Deployment config**: Kamal (`config/deploy.yml`, `.kamal/`) with Dockerfile via Thruster/Puma — present but unused.
- **CORS**: `rack-cors` in `config/initializers/cors.rb` allows origins `http://localhost:5173` **and** `http://127.0.0.1:5173` (both loopback spellings; a missing origin manifests in the browser as `TypeError: Failed to fetch`). Initializer changes need a server restart.

## Conventions

Machine-readable convention files live in `.claude/rules/` (`api-conventions.md`, `testing.md`, `frontend-conventions.md`) — read the one matching the files you touch. Summary:

- RESTful routes versioned under `/api/v1`; controllers in `app/controllers/api/v1/`
- Use `bin/rails` generators for models/migrations; never hand-edit `db/schema.rb`
- Every endpoint gets a request spec asserting status code AND response JSON shape, success and failure paths
- Errors return `{ "errors": [...] }` — every error payload, no other formats; 201 create, 204 destroy, 422 validation failure
- Factories stay minimal (required attrs only); `attributes_for` for request params
- Prefer Solid Queue jobs over inline work for anything slow

## The Tasks feature — current state (detailed)

### API contract (all verified by request specs)

| Endpoint | Success | Failure |
|---|---|---|
| `GET /api/v1/tasks` | 200, array **ordered by id** | — |
| `GET /api/v1/tasks/:id` | 200, task | 404 `{errors: ["Task not found"]}` |
| `POST /api/v1/tasks` `{task: {title, description}}` | 201, task | 422 `{errors: [...]}`; **400** (same envelope) when the `task` key is missing/malformed |
| `PATCH /api/v1/tasks/:id` `{task: {title?, description?, completed?}}` | 200, updated task | 422 / 404 |
| `DELETE /api/v1/tasks/:id` | 204, no body | 404 |

Task JSON shape: exactly `{ id, title, description, completed, created_at, updated_at }`.

### Backend implementation

- **Model** (`app/models/task.rb`): `title` and `description` both presence-validated. DB constraints match: `description NOT NULL` and `completed NOT NULL DEFAULT false` (create migration), `title NOT NULL` (follow-up migration `20260719122954`).
- **Controller** (`app/controllers/api/v1/tasks_controller.rb`): thin per conventions. Strong params via Rails 8.1 `params.expect(task: [:title, :description, :completed])`. `rescue_from ActiveRecord::RecordNotFound` → 404 envelope; `rescue_from ActionController::ParameterMissing` → 400 envelope. Uses `:unprocessable_content` (Rack deprecated `:unprocessable_entity`; same 422 wire status) — keep new code consistent.
- **Specs**: `spec/requests/api/v1/tasks_spec.rb` (16 examples — every endpoint/status/shape, envelope contents, ordering, no-record-created/changed guards written as `expect { }.not_to change { }` so they don't couple to factory literals) + `spec/models/task_spec.rb` (3 presence examples). Factory: `spec/factories/tasks.rb`, title + description only.

### Frontend implementation (`frontend/src/`, npm config at repo root)

- **Routing** (react-router-dom 7): `BrowserRouter` lives only in `index.jsx` so tests can wrap `App` in `MemoryRouter`. `App.jsx` holds the nav (`NavLink`, which sets the `active` class styled in `index.html`) and the `Routes`: `/` → `Home` (placeholder for the upcoming home-page feature), `/tasks` → `TasksPage` (heading + `TaskList`), `*` → `NotFound`. Deep-linking `/tasks` needs **both** webpack settings: `output.publicPath: "/"` (else the relative `main.js` request at a nested route gets index.html served back) and `devServer.historyApiFallback: true` — don't remove either.
- **`api.js`** is the single HTTP boundary — components never call `fetch`. A shared `request()` helper adds JSON headers when a body is present (merging, not clobbering, caller headers), returns `null` for 204, parses JSON otherwise, and throws `ApiError` (fields: `status`, `errors[]` from the envelope, message = errors joined). Exports `fetchTasks(signal)`, `createTask`, `updateTask`, `deleteTask`; bodies are `{ task: {...} }` to match strong params.
- **`components/TaskList.jsx`** — the container; owns all state: `tasks`, `pendingTaskIds`, `loading`, `loadError`, `actionError`. Mount fetch uses `AbortController` (cleanup on unmount, `AbortError` ignored). Handlers update local state **from each response — never refetch the list**: POST body appended, PATCH body replaces the matching task, 204 filters the id out. Error semantics: a task's id is in `pendingTaskIds` while its PATCH/DELETE is in flight (guards the double-toggle race by disabling that row's controls); toggle-404 removes the phantom row and sets the banner "That task no longer exists on the server, so it was removed from the list."; delete-404 removes it silently (delete is idempotent); other failures set `actionError` (a banner — the list never unmounts for action errors, unlike `loadError`).
- **`components/Task.jsx`** — presentational only: checkbox (toggles via callback), Delete button, both disabled when `pending`; strikethrough style for completed.
- **`components/TaskForm.jsx`** — controlled inputs; no client-side validation (the server's 422 envelope is the source of truth, rendered as an error list); button shows disabled "Adding…" while submitting; clears on success.
- **Env plumbing**: `API_URL` comes from the repo-root `.env` (gitignored; content `API_URL=http://localhost:3000`) read by `frontend/webpack.config.js` via Node's `process.loadEnvFile()` (no dotenv dependency) and inlined with `DefinePlugin`; the config falls back to the same default when `.env` is absent. Dev server port **5173 is coupled to the CORS origins** — don't change one without the other. `context: __dirname` keeps webpack paths stable since npm scripts run from the repo root.
- **Styles** live in the `<style>` block of `frontend/src/index.html`; no CSS tooling.

### Frontend tests (Jest + RTL, 24 tests / 4 suites)

- Colocated `frontend/src/**/*.test.jsx`. Config: `jest.config.js` (jsdom env; `setupFiles: frontend/jest.env.js` runs **before modules load** — it sets `process.env.API_URL` (read by `api.js` at import time; tests have no DefinePlugin) and polyfills `TextEncoder`/`TextDecoder`, which react-router requires at import time but Jest's jsdom env doesn't provide; `setupFilesAfterEnv: frontend/jest.setup.js` loads jest-dom).
- **Babel presets live in the root `babel.config.js`, shared by webpack and babel-jest — never inline them back into the webpack config.**
- Conventions: mock at the `api.js` boundary (`jest.mock("../api")`), never `fetch` (jsdom has none anyway); query by role/label text; `user-event` for interactions; deferred-promise mocks (`mockImplementation` capturing `resolve`) to assert in-flight states.
- Coverage: Task rendering/callbacks/pending-disable; TaskForm submit/success-clear/422-errors/values-survive-failure/submitting-state; TaskList load states + toggle success/pending/404/generic-failure + delete success/404 + create-appends (driven through the real form); App routing (home at `/`, tasks at `/tasks`, nav navigation both directions, unknown-path 404 page — `MemoryRouter` with `initialEntries`).

## Work history (what was done, in order)

Commits `af46e5f` (bare Rails skeleton) → `e87218f` (current HEAD):

1. **Tasks API, spec-first** — request specs written before any implementation and confirmed failing (first on missing schema, then meaningfully on missing routes), then model/routes/controller implemented to green. CORS enabled for the frontend origin.
2. **Frontend scaffold** — React 19 + Webpack (no TypeScript, minimal dependency set, no dotenv/CSS loaders), `package.json` at the **repo root** by explicit decision, `TaskList` read-only view first.
3. **CRUD UI** — `api.js` boundary module, `TaskForm` (422 envelope display), checkbox toggle + delete, all updating local state from responses. `bin/dev` gained Foreman + `Procfile.dev` (one command, both servers) and later a Postgres preflight check.
4. **Review rounds** (via the repo's reviewer agents; all findings verified then fixed) — added: `ParameterMissing` → 400 envelope + spec; stable `order(:id)` + spec; `title NOT NULL` migration; api.js header merge; spec decoupling from factory literals; the pending-per-task race guard; 404 reconciliation (remove phantom rows); form error-list keys.
5. **Jest + RTL suite** — config as above plus 8 interaction tests covering the race guard and 404 branches. The former "no new dependencies" frontend rule was **deliberately removed** (test framework and ESLint are sanctioned additions).

## Claude Code setup in this repo

- **Rules**: `.claude/rules/` — `api-conventions.md` (controllers/routes), `testing.md` (specs), `frontend-conventions.md` (frontend/). Reviewer checklists mirror these files; keep them in sync when conventions change.
- **Agents**: `.claude/agents/rails-reviewer.md` (backend; skips `frontend/` except the API contract) and `.claude/agents/frontend-reviewer.md` (frontend; always runs `npm run build`, runs `npm test`/`npm run lint` when the scripts exist, runs `bin/rspec spec/requests` when API interaction changed). Both report file+line findings, most-severe first. `.claude/agents/github-pr.md` handles the delivery flow for verified work (branch → scoped staging → commit → push → PR → watch checks); it needs the invoker to state the task's files and verification results, never stages unrelated changes, and knows the stale-`gh`-keyring failure mode (falls back to the compare URL and asks for `gh auth login`). Note: all agents register natively only in sessions **started inside this repo**; from a workspace-root session, have a general-purpose agent adopt the definition file verbatim.
- **Skill**: `.claude/skills/new-endpoint/` — scaffold recipe for adding another API resource.
- **Hook**: `.claude/hooks/rubocop-autocorrect.sh` runs on Edit/Write (PostToolUse).
- **Permissions — TEMPORARY DEMO STATE**: `.claude/settings.json` currently has `defaultMode: bypassPermissions`, blanket `Bash(*)`/`Edit`/`Read` allows, and **no `ask` or `deny` rules** (the `git push`/`kamal`/`db:drop`/`db:reset` gates and the `master.key`/credentials/`.env` read-protections were deliberately stripped for a zero-prompt demo on 2026-07-20). **After the demo, offer to restore the ask gates and deny rules.**

## Known follow-ups

- Two verified-minor test gaps (found by frontend-reviewer + adversarial verification): `handleDelete`'s generic-failure branch is untested (TaskList.jsx ~line 83); success-path banner clearing (`setActionError(null)`) is untested — mutation-proven. (A third — no `clearMocks` in `jest.config.js` — was fixed when the routing suite added the first negative call-count assertion.)
- ESLint is planned but not yet added (`npm run lint` doesn't exist; the frontend-reviewer auto-detects it when it lands).
- CI runs RSpec but not Jest — the frontend suite still doesn't gate CI.
- Permission config restore after the demo (see above).
