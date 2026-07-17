# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A freshly generated **Rails 8.1 API-only** application (Ruby 3.4.7, PostgreSQL). The only route is the `/up` health check — there are no domain models, controllers, or migrations so far. This application will be used for development/testing purposes and will not be deployed anywhere.

## Commands

Run everything through the binstubs in `bin/` (they handle Bundler):

- `bin/setup` — install gems and prepare the database (add `--skip-server` to not boot the app afterward)
- `bin/dev` — start both dev servers via Foreman (`Procfile.dev`: Rails API on :3000, webpack frontend on :5173); installs foreman on demand
- `bin/rails console` / `bin/rails db:migrate` / `bin/rails db:prepare` — usual Rails tasks
- `bin/rspec` — run the test suite
  - Single file: `bin/rspec spec/models/foo_spec.rb`
  - Single example: `bin/rspec spec/models/foo_spec.rb:42`
- `bin/rubocop` — lint (rubocop-rails-omakase style; config in `.rubocop.yml`)
- `bin/brakeman` — static security analysis
- `bin/bundler-audit` — audit gems for known CVEs

CI (`.github/workflows/ci.yml`) runs Brakeman, bundler-audit, and RuboCop on PRs and pushes to `main`. **It does not run RSpec** — add a test job if the suite should gate CI.

## Architecture

- **API-only mode**: `config.api_only = true` in `config/application.rb`; `ApplicationController` inherits from `ActionController::API`. There are no views, assets, or session/cookie middleware — add middleware back explicitly if needed.
- **Testing**: RSpec + FactoryBot (factories belong in `spec/factories/`). Generators are configured to skip view/helper/routing specs. Note `.rspec` only requires `spec_helper` — specs that touch Rails must `require 'rails_helper'` themselves.
- **Solid trifecta**: cache (`solid_cache`), background jobs (`solid_queue`), and Action Cable (`solid_cable`) are all database-backed. Their schemas live in `db/cache_schema.rb`, `db/queue_schema.rb`, and `db/cable_schema.rb`; in production each uses a separate database (see `config/database.yml`).
- **Deployment**: Kamal (`config/deploy.yml`, `.kamal/`) with a Dockerfile served through Thruster/Puma.

## Conventions

- RESTful routes, versioned under namespace /api/v1
- Use bin/rails generators for models/migrations; never hand-edit db/schema.rb
- Every endpoint gets a request spec asserting status code AND response JSON shape
- Errors return { "errors": [...] }; 422 on validation failure, 201 create, 204 destroy
- Factories stay minimal (required attrs only); traits/overrides per-test; attributes_for for params
- Prefer Solid Queue jobs over inline work for anything slow

## Frontend

This app has a basic frontend that is built with React and Webpack. Plain JavaScript/JSX, no TypeScript. If needed, a simple router/state library will be used.
- The `package.json` is in the repo root while all frontend code is in the `/frontend` directory.
- To start both the backend and frontend, run `bin/dev`.

# The `Task` model

The Rails app has a `Task` model and associated controller for CRUD operations on `Task`s. The frontend has components that will be used to render `Task`s: `Task.jsx` and `TaskList.jsx`.