import { test, expect } from "@playwright/test";

test.describe("AppComponent", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page title is set", async ({ page }) => {
    await expect(page).toHaveTitle(/GameViewer/);
  });

  test("collections section heading visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Collections=>GameVersions and DlcVersions" })).toBeVisible();
  });

  test("games section heading visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Games=>Super versions" })).toBeVisible();
  });

  test("series section heading visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Series=>Games" })).toBeVisible();
  });

  test("game versions section heading visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "GameVersions=>DlcVersions" })).toBeVisible();
  });

  test("all four main section headings are present", async ({ page }) => {
    const headings = page.locator("h1");
    await expect(headings).toHaveCount(4);
  });

  test("game-ui component is rendered", async ({ page }) => {
    await expect(page.locator("app-game-ui")).toBeVisible();
  });

  test("content area is present", async ({ page }) => {
    await expect(page.locator(".content")).toBeVisible();
  });
});
