# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A freshly generated **Rails 8.1 API-only** application (Ruby 3.4.7, PostgreSQL). The git repository has no commits yet, and the only route is the `/up` health check — there are no domain models, controllers, or migrations so far.

## Commands

Run everything through the binstubs in `bin/` (they handle Bundler):

- `bin/setup` — install gems and prepare the database (add `--skip-server` to not boot the app afterward)
- `bin/dev` — start the dev server (just execs `bin/rails server`)
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
