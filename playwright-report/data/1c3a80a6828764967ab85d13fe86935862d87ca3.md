# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.component.spec.ts >> AppComponent >> resources section is present
- Location: e2e\app.component.spec.ts:73:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2:text(\'Resources\')')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h2:text(\'Resources\')')

```

```yaml
- paragraph: game-ui works!
- 'heading "Age of Empires II: The Age of Kings" [level=3]'
- text: "First release: 1999 Genre: RTS"
- heading "Game versions:" [level=2]
- list:
  - button "Original (Win)"
- list:
  - button "Remaster (Win)"
- list:
  - button "Remaster (Win)"
- heading "Collections=>GameVersions and DlcVersions" [level=1]
- heading "Games=>Super versions" [level=1]
- heading "Series=>Games" [level=1]
- heading "GameVersions=>DlcVersions" [level=1]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("AppComponent", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/");
  6  |   });
  7  | 
  8  |   test("page title is set", async ({ page }) => {
  9  |     await expect(page).toHaveTitle(/gameViewer/);
  10 |   });
  11 | 
  12 |   test("toolbar displays welcome message", async ({ page }) => {
  13 |     await expect(page.locator("text=Welcome")).toBeVisible();
  14 |   });
  15 | 
  16 |   test("app is running banner visible", async ({ page }) => {
  17 |     await expect(page.locator("text=gameViewer app is running!")).toBeVisible();
  18 |   });
  19 | 
  20 |   test("collections section heading visible", async ({ page }) => {
  21 |     await expect(page.locator("h1:text('Collections=>GameVersions and DlcVersions')")).toBeVisible();
  22 |   });
  23 | 
  24 |   test("games section heading visible", async ({ page }) => {
  25 |     await expect(page.locator("h1:text('Games=>Super versions')")).toBeVisible();
  26 |   });
  27 | 
  28 |   test("series section heading visible", async ({ page }) => {
  29 |     await expect(page.locator("h1:text('Series=>Games')")).toBeVisible();
  30 |   });
  31 | 
  32 |   test("game versions section heading visible", async ({ page }) => {
  33 |     await expect(page.locator("h1:text('GameVersions=>DlcVersions')")).toBeVisible();
  34 |   });
  35 | 
  36 |   test("all 10 series are displayed", async ({ page }) => {
  37 |     const seriesHeadings = page.locator("h1:text('Series=>Games') ~ div h3 a");
  38 |     await expect(seriesHeadings).toHaveCount(10);
  39 |   });
  40 | 
  41 |   test("Warcraft series shows correct game", async ({ page }) => {
  42 |     const warcraftSeries = page.locator("h3 a", { hasText: "Warcraft" }).first();
  43 |     await expect(warcraftSeries).toBeVisible();
  44 |     const gameLink = warcraftSeries.locator("..").locator("..").locator("div.card-container a", { hasText: "Warcraft 3: Reign of Chaos" });
  45 |     await expect(gameLink).toBeVisible();
  46 |   });
  47 | 
  48 |   test("Metal Gear Solid series shows multiple games", async ({ page }) => {
  49 |     const mgsSeries = page.locator("h3 a", { hasText: "Metal Gear Solid" }).first();
  50 |     await expect(mgsSeries).toBeVisible();
  51 |     const parent = mgsSeries.locator("..").locator("..");
  52 |     await expect(parent.locator("div.card-container a", { hasText: "Metal Gear Solid" }).first()).toBeVisible();
  53 |     await expect(parent.locator("div.card-container a", { hasText: "Metal Gear Solid 2: Sons of Liberty" }).first()).toBeVisible();
  54 |     await expect(parent.locator("div.card-container a", { hasText: "Metal Gear Solid 3: Snake Eater" }).first()).toBeVisible();
  55 |     await expect(parent.locator("div.card-container a", { hasText: "Metal Gear Solid 4: Guns of the Patriots" }).first()).toBeVisible();
  56 |   });
  57 | 
  58 |   test("Red Dead series shows DLC under games", async ({ page }) => {
  59 |     const redDeadSeries = page.locator("h3 a", { hasText: "Red Dead" }).first();
  60 |     await expect(redDeadSeries).toBeVisible();
  61 |     const parent = redDeadSeries.locator("..").locator("..");
  62 |     await expect(parent.locator("a", { hasText: "Red Dead Redemption: Undead Nightmare" }).first()).toBeVisible();
  63 |   });
  64 | 
  65 |   test("Witcher series shows DLCs", async ({ page }) => {
  66 |     const witcherSeries = page.locator("h3 a", { hasText: "The Witcher" }).first();
  67 |     await expect(witcherSeries).toBeVisible();
  68 |     const parent = witcherSeries.locator("..").locator("..");
  69 |     await expect(parent.locator("a", { hasText: "Hearts of Stone" }).first()).toBeVisible();
  70 |     await expect(parent.locator("a", { hasText: "Blood and Wine" }).first()).toBeVisible();
  71 |   });
  72 | 
  73 |   test("resources section is present", async ({ page }) => {
> 74 |     await expect(page.locator("h2:text('Resources')")).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  75 |     await expect(page.locator("text=Learn Angular")).toBeVisible();
  76 |   });
  77 | 
  78 |   test("next steps section is present", async ({ page }) => {
  79 |     await expect(page.locator("h2:text('Next Steps')")).toBeVisible();
  80 |   });
  81 | 
  82 |   test("terminal shows default command", async ({ page }) => {
  83 |     await expect(page.locator("pre:text('ng generate component xyz')")).toBeVisible();
  84 |   });
  85 | 
  86 |   test("collection links are displayed", async ({ page }) => {
  87 |     await expect(page.locator("h1:text('Collections=>GameVersions and DlcVersions') ~ div h3 a").first()).toBeVisible();
  88 |   });
  89 | 
  90 |   test("game super version buttons are rendered", async ({ page }) => {
  91 |     const gamesHeader = page.locator("h1:text('Games=>Super versions')");
  92 |     await expect(gamesHeader).toBeVisible();
  93 |     const firstGameTitle = page.locator("h1:text('Games=>Super versions') ~ div h3 a").first();
  94 |     await expect(firstGameTitle).toBeVisible();
  95 |   });
  96 | });
  97 | 
```