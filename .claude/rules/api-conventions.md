---
paths:
  - "app/controllers/**"
  - "config/routes.rb"
---

# API conventions

- All endpoints are RESTful and versioned under the `/api/v1` namespace: `Api::V1::` controllers in `app/controllers/api/v1/`, routes nested in `namespace :api { namespace :v1 { ... } }`.
- Response contract:
  - Validation failure → `422` with body `{ "errors": [...] }`
  - Create → `201`, Destroy → `204` (no body)
  - Every error payload uses the `{ "errors": [...] }` shape — no other error formats.
- Controllers stay thin: strong params, the happy path, and status codes. Anything slow (email, external calls, heavy work) goes to a Solid Queue job in `app/jobs/`, not inline in the request.
- This is an API-only app (`ActionController::API`): sessions, cookies, and flash middleware are absent — add middleware back explicitly if a feature truly needs it.
