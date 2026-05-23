# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: game-ui.component.spec.ts >> GameUIComponent >> clicking different game version updates details
- Location: e2e\game-ui.component.spec.ts:84:7

# Error details

```
Error: expect(received).not.toEqual(expected) // deep equality

Expected: not " Original (Win) Details "

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - paragraph [ref=e5]: game-ui works!
    - generic [ref=e6]:
      - 'heading "Age of Empires II: The Age of Kings" [level=3] [ref=e7]'
      - generic [ref=e8]: "First release: 1999"
      - generic [ref=e9]: "Genre: RTS"
      - generic [ref=e10]:
        - heading "Game versions:" [level=2] [ref=e11]
        - list [ref=e12]:
          - button "Original (Win)" [ref=e13]
        - list [ref=e14]:
          - button "Remaster (Win)" [active] [ref=e15]
        - list [ref=e16]:
          - button "Remaster (Win)" [ref=e17]
      - generic [ref=e18]:
        - heading "Remaster (Win) Details" [level=2] [ref=e19]
        - generic [ref=e20]: "ID: 16"
        - generic [ref=e21]: "Collection: Age of Empires 2: Age of Kings (HD Edition)"
        - generic [ref=e22]: "Year: 2012"
        - generic [ref=e23]: "Edition: HD Edition"
        - generic [ref=e24]: "Version type: Remaster"
        - generic [ref=e25]: "Provider: Physical"
        - generic [ref=e26]: "Playable on: Win"
        - generic [ref=e27]: "Local Co-Op: No"
  - heading "Collections=>GameVersions and DlcVersions" [level=1] [ref=e28]
  - heading "Games=>Super versions" [level=1] [ref=e29]
  - heading "Series=>Games" [level=1] [ref=e30]
  - heading "GameVersions=>DlcVersions" [level=1] [ref=e31]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("GameUIComponent", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/");
  6  |   });
  7  | 
  8  |   test("game-ui component renders", async ({ page }) => {
  9  |     await expect(page.locator("[cy-data='game-ui-1000']")).toHaveText("game-ui works!");
  10 |   });
  11 | 
  12 |   test("displays a game title", async ({ page }) => {
  13 |     await expect(page.locator("[cy-data='game-ui-3000']")).toBeVisible();
  14 |   });
  15 | 
  16 |   test("displays first release info", async ({ page }) => {
  17 |     await expect(page.locator("[cy-data='game-ui-4000']")).toContainText("First release:");
  18 |   });
  19 | 
  20 |   test("displays genre info", async ({ page }) => {
  21 |     await expect(page.locator("[cy-data='game-ui-5000']")).toContainText("Genre:");
  22 |   });
  23 | 
  24 |   test("displays game versions heading", async ({ page }) => {
  25 |     await expect(page.locator("[cy-data='game-ui-7000']")).toHaveText("Game versions:");
  26 |   });
  27 | 
  28 |   test("game version buttons are rendered", async ({ page }) => {
  29 |     const buttons = page.locator("[cy-data='game-ui-10000']");
  30 |     await expect(buttons.first()).toBeVisible();
  31 |     await expect(buttons).toHaveCount(3);
  32 |   });
  33 | 
  34 |   test("clicking a game version shows details", async ({ page }) => {
  35 |     const firstButton = page.locator("[cy-data='game-ui-10000']").first();
  36 |     await firstButton.click();
  37 |     await expect(page.locator("[cy-data='game-ui-12000']")).toBeVisible();
  38 |   });
  39 | 
  40 |   test("details panel shows ID after selection", async ({ page }) => {
  41 |     await page.locator("[cy-data='game-ui-10000']").first().click();
  42 |     await expect(page.locator("[cy-data='game-ui-13000']")).toContainText("ID:");
  43 |   });
  44 | 
  45 |   test("details panel shows collection after selection", async ({ page }) => {
  46 |     await page.locator("[cy-data='game-ui-10000']").first().click();
  47 |     await expect(page.locator("[cy-data='game-ui-14000']")).toContainText("Collection:");
  48 |   });
  49 | 
  50 |   test("details panel shows year after selection", async ({ page }) => {
  51 |     await page.locator("[cy-data='game-ui-10000']").first().click();
  52 |     await expect(page.locator("[cy-data='game-ui-15000']")).toContainText("Year:");
  53 |   });
  54 | 
  55 |   test("details panel shows edition after selection", async ({ page }) => {
  56 |     await page.locator("[cy-data='game-ui-10000']").first().click();
  57 |     await expect(page.locator("[cy-data='game-ui-16000']")).toContainText("Edition:");
  58 |   });
  59 | 
  60 |   test("details panel shows version type after selection", async ({ page }) => {
  61 |     await page.locator("[cy-data='game-ui-10000']").first().click();
  62 |     await expect(page.locator("[cy-data='game-ui-17000']")).toContainText("Version type:");
  63 |   });
  64 | 
  65 |   test("details panel shows provider after selection", async ({ page }) => {
  66 |     await page.locator("[cy-data='game-ui-10000']").first().click();
  67 |     await expect(page.locator("[cy-data='game-ui-18000']")).toContainText("Provider:");
  68 |   });
  69 | 
  70 |   test("details panel shows playable on after selection", async ({ page }) => {
  71 |     await page.locator("[cy-data='game-ui-10000']").first().click();
  72 |     await expect(page.locator("[cy-data='game-ui-19000']")).toContainText("Playable on:");
  73 |   });
  74 | 
  75 |   test("details panel shows local co-op after selection", async ({ page }) => {
  76 |     await page.locator("[cy-data='game-ui-10000']").first().click();
  77 |     await expect(page.locator("[cy-data='game-ui-20000']")).toContainText("Local Co-Op:");
  78 |   });
  79 | 
  80 |   test("details panel is hidden before selection", async ({ page }) => {
  81 |     await expect(page.locator("[cy-data='game-ui-12000']")).toHaveCount(0);
  82 |   });
  83 | 
  84 |   test("clicking different game version updates details", async ({ page }) => {
  85 |     const buttons = page.locator("[cy-data='game-ui-10000']");
  86 |     const count = await buttons.count();
  87 |     test.skip(count < 2, "Need at least 2 game versions");
  88 |     await buttons.nth(0).click();
  89 |     const firstDetails = await page.locator("[cy-data='game-ui-12000']").textContent();
  90 |     await buttons.nth(1).click();
  91 |     const secondDetails = await page.locator("[cy-data='game-ui-12000']").textContent();
> 92 |     expect(firstDetails).not.toEqual(secondDetails);
     |                              ^ Error: expect(received).not.toEqual(expected) // deep equality
  93 |   });
  94 | });
  95 | 
```