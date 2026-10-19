# Conduit · Playwright test framework

[![Playwright tests](https://github.com/aleksandrpiletskii/conduit-playwright/actions/workflows/playwright.yml/badge.svg)](https://github.com/aleksandrpiletskii/conduit-playwright/actions/workflows/playwright.yml)
[![Report](https://img.shields.io/badge/report-latest-2EAD33?logo=playwright&logoColor=white)](https://aleksandrpiletskii.github.io/conduit-playwright/)

UI + API test framework for [Conduit](https://demo.realworld.show), the RealWorld reference app (a Medium clone with a public REST API).

Built to show how I structure test automation: layered fixtures, Page and Component Objects, API-driven setup, deterministic stubs, mutation checks and CI with a published report.

## Architecture

```
src/
├── api/          Typed API client (ConduitApi) and contract types
├── components/   Component Objects: Header, ArticlePreview, TagList
├── pages/        Page Objects built from components
├── fixtures/     Layered fixtures: accounts → API clients → seeded data → session → pages
├── stubs/        Network stubs and response tampering
├── data/         Factories for unique test data and fixed stub payloads
└── config/       Target environment (overridable via env vars)
tests/
├── api/          Contract and negative API tests, no browser
└── ui/           Browser tests: auth, articles, stubbed feed, API ↔ UI consistency
```

### Fixture layers

| Layer | Fixture | Scope | What it does |
|---|---|---|---|
| Accounts | `workerUser` | worker | One account per worker, registered via API and verified (see below). Parallel workers never share data |
| API | `api`, `userApi` | test | Anonymous and authenticated API clients |
| Data | `article` | test | Creates an article via API before the test and deletes it after |
| Session | `signedIn` | test | Puts the API token into `localStorage` before page load, so UI tests skip the login form |
| Pages | `home`, `editor`, ... | test | Page Objects ready to use |

### Techniques worth a look

- **API-first setup.** UI tests seed data and sessions through the API and test only the UI behavior they are about (`tests/ui/articles.spec.ts`).
- **Deterministic stubs.** The feed is rendered from fixed payloads, so the result never depends on live data (`tests/ui/feed.stubbed.spec.ts`).
- **API ↔ UI consistency.** The feed must show exactly what the API returns (`tests/ui/feed-consistency.spec.ts`).
- **Mutation check.** The same consistency check runs against a tampered response and is expected to fail. If it ever passes, the assertion has stopped catching real defects.
- **Cleanup that survives failures.** Seeded data is removed in fixture teardown or `finally` blocks, and cleanup tolerates already-deleted entities.

## Notes on the demo backend

Findings from the first CI runs against the public API, and how the framework handles them:

- **Accounts are sandboxed.** An article is visible only to its author, so tests open seeded articles in the author's session instead of anonymously.
- **Email uniqueness isn't enforced across accounts.** A duplicate sign-up succeeds, so there is no duplicate-email test.
- **Identity collisions under parallel sign-ups.** A freshly issued token was occasionally resolved to another account: articles came back authored by someone else and deletes were refused. `createVerifiedAccount` waits a moment, takes a new token and checks that it resolves to the same username, re-creating the account if not.

## Run locally

```bash
npm install
npx playwright install chromium

npm test              # everything
npm run test:api      # API only, no browser
npm run test:ui       # browser tests
npm run report        # open the last HTML report
```

Run against another instance:

```bash
BASE_URL=http://localhost:4200 API_URL=http://localhost:3000/api npm test
```

## CI

GitHub Actions runs on every push, pull request and nightly on weekdays:

1. Type check, then tests split into 2 shards.
2. Shard blob reports are merged into one HTML report.
3. On `main`, the report is published to [GitHub Pages](https://aleksandrpiletskii.github.io/conduit-playwright/).

## Stack

Playwright Test · TypeScript · GitHub Actions · GitHub Pages
