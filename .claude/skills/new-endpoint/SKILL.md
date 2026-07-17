---
description: Scaffold a new versioned API resource (model, routes, controller, factory, request specs) following this repo's conventions. Use when adding a new resource or endpoint to the API.
argument-hint: "[resource-name]"
---

Add a new API resource to this Rails 8.1 API-only app: $ARGUMENTS

Work through these steps, following CLAUDE.md and `.claude/rules/`:

1. **Model + migration** — `bin/rails generate model <Name> <attrs>`, then `bin/rails db:migrate`. Never hand-edit `db/schema.rb`. Add validations for every attribute the API treats as required.
2. **Routes** — RESTful `resources` nested under `namespace :api { namespace :v1 { ... } }` in `config/routes.rb`, restricted with `only:` to the actions actually needed.
3. **Controller** — `app/controllers/api/v1/<name>_controller.rb` inheriting from `ApplicationController`. Status codes: `201` on create, `204` on destroy, `422` with `{ "errors": [...] }` on validation failure. Keep it thin; slow work goes to a Solid Queue job.
4. **Factory** — `spec/factories/<name>.rb` with required attributes only.
5. **Request specs** — `spec/requests/api/v1/<name>_spec.rb` (starts with `require "rails_helper"`), asserting status code AND response JSON shape for both success and failure paths; use `attributes_for` for params.
6. **Verify** — run `bin/rspec` and `bin/rubocop -a`; both must pass before the work is done.
