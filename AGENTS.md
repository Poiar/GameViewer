# GameViewer — AGENTS.md

## Quick start
- `npm start` — dev server on `http://localhost:4200/`
- `npm test` — Jasmine/Karma tests via Chrome (no headless)
- `npm run build` — production build to `dist/game-viewer/`
- No linter, no typecheck script, no CI

## Architecture
- **Angular 21** (upgraded from 14), no router, no services, no HttpClient. Both `AppComponent` and `GameUIComponent` have `standalone: false` to keep working with `AppModule`
- **AppModule** declares exactly: `AppComponent`, `GameUIComponent`
- **No spec files exist** — `src/test.ts` has no `require.context()` call (removed during v21 upgrade)
- Entrypoint: `src/main.ts` -> `AppModule` -> `AppComponent` -> `GameUIComponent`

## Data layer
- All data is hardcoded as **module-level constant arrays** that self-register at import time via constructors pushing to exported arrays (`allGames`, `allCollections`, `allSeries`, `allGameVersions`, `allDlcs`, `allDlcVersions`, `allSuperVersions`)
- Each data file has `console.log({all...})` at module scope — importing a class file prints its entire registry
- `src/data/entries.json` exists but is empty (unused)
- Adding a new game requires: `Content`, `Game`/`Dlc`, `SuperVersion`, `GameVersion`/`DlcVersion`, `Collection` — follow existing pattern

## Model hierarchy
```
Content (abstract: id, title, firstRelease)
├── Game (genre, series, superVersions[], alternativeTitles)
└── Dlc (dlcType, dlcVersions[])
SuperVersion (game, versionType, versionName, versionYear, gameVersions[])
GameVersion (superVersion, provider, intendedFor[], playableOn[], dlcVersionsThatThisCanUse[])
DlcVersion (dlc, gameVersionsThisCanBeUsedOn[], onDiscForConsoleOnly)
Collection (title, gameVersions[], dlcVersions[], media, releaseYear)
Series (title, games[])
```

## Conventions
- **EditorConfig**: 2-space indent, single quotes for TS, UTF-8, trailing newline
- **Strict mode** enabled (tsconfig: strict, noImplicitOverride, strictTemplates, etc.)
- **Enum pattern**: declarations use a companion namespace with a `toString()` method — check `genreEnum`, `systemEnum`, `unsureBoolEnum`, `providerEnum`, `versionEnum` for examples
- **`cy-data` attributes** on all interactive template elements (e.g., `cy-data="app-1000"`) — always include when modifying templates
- **Naming convention for exported instances**: `gv_<platform>_<provider>_<versionType>_<game>` for game versions, `sv_<versionType>_<game>` for super versions

## Dead / commented-out code
- `src/classes/gameIteration.ts` — fully commented out (legacy concept, not used)
- The Orange Box collection in `collection.ts` is commented out
- Several helper methods in `game.ts` (`getAllDlcForThisGame`) have dead code commented inside

## Gotchas
- `versionEnum` namespace has a bug: `case versionEnum.demake:` returns `"Downsample"` (same as `downsample`), not `"Demake"`
