# AGENTS.md

## Quick reference

| Command | Description |
|---------|-------------|
| `ng serve` | Dev server at `http://localhost:4200/` |
| `ng build` | Production build to `dist/game-viewer/` |
| `npm test` | Playwright E2E tests (Chromium) |
| `npx playwright test --ui` | Playwright tests with UI mode |
| `npx playwright test --headed` | Playwright tests in headed browser |
| `ng generate component <name>` | Scaffold a new component |
| `npm run lint` | Lint TypeScript + HTML (ESLint + Prettier) |
| `npm run lint:fix` | Lint and auto-fix issues |
| `npm run format` | Format source files with Prettier |
| `npm run format:check` | Check formatting without fixing |
| `npm run typecheck` | TypeScript type check (tsc --noEmit) |
| `npm run prepare` | Install Husky git hooks |

## Architecture

- **Angular v21**, single module (`AppModule`), **no routing** — single-page app.
- Strict TypeScript: `strict`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, strict template checking all enabled.
- Two components: `AppComponent` (root), `GameUIComponent` (details panel).

## Data model (`src/classes/`)

All game data is hardcoded as TypeScript module constants. The class hierarchy:

```
Content (abstract: id, title, firstRelease)
├── Game → SuperVersion → GameVersion
├── Dlc → DlcVersion
├── Series (groups Games)
└── Collection (groups GameVersions + DlcVersions)
```

**Critical convention**: every class constructor self-registers the instance into a module-level array (`allGames`, `allSeries`, `allSuperVersions`, `allGameVersions`, `allDlcs`, `allDlcVersions`, `allCollections`). Importing a module from `src/classes/` triggers all its top-level `new X(...)` calls, populating these arrays as a side effect. AppComponent binds directly to these arrays.

## Linting

ESLint + Prettier are configured for TypeScript and HTML files. Run `npm run lint` to check and `npm run lint:fix` to auto-fix. The `.editorconfig` enforces LF line endings to prevent CRLF issues.

## Testing

**Playwright** is used for UI/E2E testing (replaced Karma/Jasmine). Tests live in `e2e/` directory.

- `npm test` — runs all Playwright tests headlessly
- `npx playwright test --ui` — interactive UI mode
- `npx playwright test --headed` — run in visible browser
- `npx playwright test --debug` — step-through debugger

Test files:
- `e2e/app.component.spec.ts` — AppComponent E2E tests (sections, series, collections, navigation)
- `e2e/game-ui.component.spec.ts` — GameUIComponent E2E tests (rendering, selection, details panel)

The Playwright config (`playwright.config.ts`) auto-starts `ng serve` on port 4200 before tests.

## No typecheck script

No `typecheck` npm script. Angular CLI performs type checking during `ng build` / `ng serve`.