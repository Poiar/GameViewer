# AGENTS.md

## Quick reference

| Command                        | Description                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `ng serve`                     | Dev server at `http://localhost:4200/` — **always use the "ng: serve" run configuration in WebStorm instead of running this in a terminal** |
| `ng build`                     | Production build to `dist/game-viewer/`                                                                                                     |
| `npm test`                     | Playwright tests with UI mode                                                                                                               |
| `npm run test:headless`        | Playwright tests headless                                                                                                                   |
| `npx playwright test --headed` | Playwright tests in headed browser                                                                                                          |
| `ng generate component <name>` | Scaffold a new component                                                                                                                    |
| `npm run lint`                 | Lint TypeScript + HTML (ESLint + Prettier)                                                                                                  |
| `npm run lint:fix`             | Lint and auto-fix issues                                                                                                                    |
| `npm run format`               | Format source files with Prettier                                                                                                           |
| `npm run format:check`         | Check formatting without fixing                                                                                                             |
| `npm run typecheck`            | TypeScript type check (tsc --noEmit)                                                                                                        |
| `npm run prepare`              | Install Husky git hooks                                                                                                                     |

## Architecture

- **Angular v21**, standalone components, **no routing** — single-page app.
- Strict TypeScript: `strict`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, strict template checking all enabled.
- Four components: `AppComponent` (root), `GameUIComponent` (details panel), `InventoryComponent`, `AuthComponent`.

## Data model (`src/classes/`)

All game data is hardcoded as TypeScript module constants. The class hierarchy:

```
Content (abstract: id, title, firstRelease)
├── Game → SuperVersion → GameVersion
├── Dlc → DlcVersion
├── Series (groups Games)
└── Collection (groups GameVersions + DlcVersions)
```

Key enums: `genreEnum`, `versionEnum`, `systemEnum`, `providerEnum`, `unsureBoolEnum`, `dlcTypeEnum`, `mediaEnum`.

**Critical convention**: every class constructor self-registers the instance into a module-level array (`allGames`, `allSeries`, `allSuperVersions`, `allGameVersions`, `allDlcs`, `allDlcVersions`, `allCollections`). Importing a module from `src/classes/` triggers all its top-level `new X(...)` calls, populating these arrays as a side effect. AppComponent binds directly to these arrays.

Classes and enums live in `src/classes/model.ts`. Data instances are split across `seriesData.ts`, `gameData.ts`, `superVersionData.ts`, `gameVersionData.ts`, `dlcData.ts`, `dlcVersionData.ts`, and `collectionData.ts`, all re-exported from `model.ts`.

## Database

PostgreSQL is running in Docker (`game-catalog-db` container, port 5432, database `gamedb`). The intent is to eventually migrate the hardcoded data into this database.

## Linting & formatting

ESLint + Prettier are configured for TypeScript and HTML files. Run `npm run lint` to check and `npm run lint:fix` to auto-fix. The `.editorconfig` enforces LF line endings to prevent CRLF issues.

Husky + lint-staged run automatically on `git commit` — staged `*.{ts,html}` files are linted with ESLint and formatted with Prettier before the commit is allowed through. `npm run prepare` installs the hooks.

## Testing

**Playwright** is used for unit and E2E tests.

- `npm test` — runs all tests headlessly
- `npx playwright test --ui` — interactive UI mode
- `npx playwright test --headed` — run in visible browser
- `npx playwright test --debug` — step-through debugger

Test files:

- `src/classes/game.spec.ts` — model unit tests (genreEnum, Game, Series)
- `e2e/app.component.spec.ts` — AppComponent E2E tests (sections, series, collections, navigation)
- `e2e/game-ui.component.spec.ts` — GameUIComponent E2E tests (rendering, selection, details panel)

The Playwright config (`playwright.config.ts`) auto-starts `ng serve` on port 4200 before tests.
