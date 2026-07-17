---
paths:
  - "spec/**"
---

# Testing conventions

- Every endpoint gets a request spec in `spec/requests/` asserting BOTH the response status code AND the response JSON shape — success and failure paths.
- `.rspec` only auto-requires `spec_helper`; any spec that touches Rails must start with `require "rails_helper"`.
- Factories in `spec/factories/` stay minimal: required attributes only. Add variation with traits or per-test overrides, and build request params with `attributes_for`.
- Create files with the generators (`bin/rails generate ...`); they are configured for RSpec + FactoryBot and skip view/helper/routing specs.
- Never hand-edit `db/schema.rb` to make a spec pass — write a migration.
- Run: `bin/rspec` (all), `bin/rspec spec/requests/foo_spec.rb` (file), `bin/rspec spec/requests/foo_spec.rb:42` (single example).
