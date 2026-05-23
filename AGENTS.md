# AGENTS.md

## Quick reference

| Command | Description |
|---------|-------------|
| `ng serve` | Dev server at `http://localhost:4200/` |
| `ng build` | Production build to `dist/game-viewer/` |
| `ng test` | Karma/Jasmine unit tests |
| `ng generate component <name>` | Scaffold a new component |

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

## No tests exist

Zero `*.spec.ts` files in the project. `ng test` is configured but has nothing to run.

## No lint/typecheck scripts

No `lint` or `typecheck` npm scripts. Angular CLI performs type checking during `ng build` / `ng serve`.