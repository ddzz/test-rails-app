# Frontend conventions

Applies to `frontend/**` (plus `package.json` and the root `.env`).

- Plain JavaScript/JSX, no TypeScript. React + Webpack, with react-router-dom for client-side routing. Tests run on Jest + React Testing Library; ESLint is a planned addition.
- Routing: `BrowserRouter` appears only in `index.jsx` — components and tests stay router-agnostic (tests wrap `App` in `MemoryRouter` with `initialEntries`). Routes and the nav live in `App.jsx`; a new page means a new `Route` plus a `NavLink`. Never remove `output.publicPath: "/"` or `devServer.historyApiFallback: true` from the webpack config — deep-linking any client-side route needs both.
- All HTTP goes through `frontend/src/api.js`; components never call `fetch` directly. Failures carry the API's `{ "errors": [...] }` envelope via `ApiError`; DELETE's 204 resolves to `null`; request bodies are shaped `{ task: { ... } }` to match the controller's strong params.
- `API_URL` comes from the root `.env` via `process.loadEnvFile` + webpack `DefinePlugin`. Never hardcode server URLs in components. The dev server port stays **5173** — it is coupled to the allowed origins in `config/initializers/cors.rb`.
- Component shape: small named function components with default exports. Container/presentational split — state and handlers live in `TaskList`; `Task` stays stateless (data down via props, callbacks up). Forms use controlled inputs.
- The server is the source of truth for validation: surface the 422 envelope's messages, don't duplicate rules client-side.
- Update local state from each API response (append the POST body, replace with the PATCH body, filter on 204) — never refetch the whole list after a mutation.
- Effects that fetch use an `AbortController` cleaned up on unmount and ignore `AbortError`. List items are keyed by `id`.
- Styles live in the `<style>` block of `frontend/src/index.html`; there is no CSS tooling.
- Component tests are colocated `*.test.jsx` files next to the component, run with `npm test` (`npm run test:watch` for watch mode). Mock at the `api.js` boundary (`jest.mock("../api")`), never `fetch` directly. Query the DOM by role and label text, not by class or test id. Babel presets are shared between webpack and babel-jest via the root `babel.config.js` — keep them there, not inline in the webpack config.
