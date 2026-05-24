# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.component.spec.ts >> AppComponent >> series section heading visible
- Location: e2e\app.component.spec.ts:20:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Series=>Games' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Series=>Games' })

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
  9  |     await expect(page).toHaveTitle(/GameViewer/);
  10 |   });
  11 | 
  12 |   test("collections section heading visible", async ({ page }) => {
  13 |     await expect(page.getByRole("heading", { name: "Collections=>GameVersions and DlcVersions" })).toBeVisible();
  14 |   });
  15 | 
  16 |   test("games section heading visible", async ({ page }) => {
  17 |     await expect(page.getByRole("heading", { name: "Games=>Super versions" })).toBeVisible();
  18 |   });
  19 | 
  20 |   test("series section heading visible", async ({ page }) => {
> 21 |     await expect(page.getByRole("heading", { name: "Series=>Games" })).toBeVisible();
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  22 |   });
  23 | 
  24 |   test("game versions section heading visible", async ({ page }) => {
  25 |     await expect(page.getByRole("heading", { name: "GameVersions=>DlcVersions" })).toBeVisible();
  26 |   });
  27 | 
  28 |   test("all four main section headings are present", async ({ page }) => {
  29 |     const headings = page.locator("h1");
  30 |     await expect(headings).toHaveCount(4);
  31 |   });
  32 | 
  33 |   test("game-ui component is rendered", async ({ page }) => {
  34 |     await expect(page.locator("app-game-ui")).toBeVisible();
  35 |   });
  36 | 
  37 |   test("content area is present", async ({ page }) => {
  38 |     await expect(page.locator(".content")).toBeVisible();
  39 |   });
  40 | });
  41 | 
```