import { test, expect } from "@playwright/test";

test.describe("GameUIComponent", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("game-ui component renders", async ({ page }) => {
    await expect(page.locator("[cy-data='game-ui-1000']")).toHaveText("game-ui works!");
  });

  test("displays a game title", async ({ page }) => {
    await expect(page.locator("[cy-data='game-ui-3000']")).toBeVisible();
  });

  test("displays first release info", async ({ page }) => {
    await expect(page.locator("[cy-data='game-ui-4000']")).toContainText("First release:");
  });

  test("displays genre info", async ({ page }) => {
    await expect(page.locator("[cy-data='game-ui-5000']")).toContainText("Genre:");
  });

  test("displays game versions heading", async ({ page }) => {
    await expect(page.locator("[cy-data='game-ui-7000']")).toHaveText("Game versions:");
  });

  test("game version buttons are rendered", async ({ page }) => {
    const buttons = page.locator("[cy-data='game-ui-10000']");
    await expect(buttons.first()).toBeVisible();
    await expect(buttons).toHaveCount(3);
  });

  test("clicking a game version shows details", async ({ page }) => {
    const firstButton = page.locator("[cy-data='game-ui-10000']").first();
    await firstButton.click();
    await expect(page.locator("[cy-data='game-ui-12000']")).toBeVisible();
  });

  test("details panel shows ID after selection", async ({ page }) => {
    await page.locator("[cy-data='game-ui-10000']").first().click();
    await expect(page.locator("[cy-data='game-ui-13000']")).toContainText("ID:");
  });

  test("details panel shows collection after selection", async ({ page }) => {
    await page.locator("[cy-data='game-ui-10000']").first().click();
    await expect(page.locator("[cy-data='game-ui-14000']")).toContainText("Collection:");
  });

  test("details panel shows year after selection", async ({ page }) => {
    await page.locator("[cy-data='game-ui-10000']").first().click();
    await expect(page.locator("[cy-data='game-ui-15000']")).toContainText("Year:");
  });

  test("details panel shows edition after selection", async ({ page }) => {
    await page.locator("[cy-data='game-ui-10000']").first().click();
    await expect(page.locator("[cy-data='game-ui-16000']")).toContainText("Edition:");
  });

  test("details panel shows version type after selection", async ({ page }) => {
    await page.locator("[cy-data='game-ui-10000']").first().click();
    await expect(page.locator("[cy-data='game-ui-17000']")).toContainText("Version type:");
  });

  test("details panel shows provider after selection", async ({ page }) => {
    await page.locator("[cy-data='game-ui-10000']").first().click();
    await expect(page.locator("[cy-data='game-ui-18000']")).toContainText("Provider:");
  });

  test("details panel shows playable on after selection", async ({ page }) => {
    await page.locator("[cy-data='game-ui-10000']").first().click();
    await expect(page.locator("[cy-data='game-ui-19000']")).toContainText("Playable on:");
  });

  test("details panel shows local co-op after selection", async ({ page }) => {
    await page.locator("[cy-data='game-ui-10000']").first().click();
    await expect(page.locator("[cy-data='game-ui-20000']")).toContainText("Local Co-Op:");
  });

  test("details panel is hidden before selection", async ({ page }) => {
    await expect(page.locator("[cy-data='game-ui-12000']")).toHaveCount(0);
  });

  test("clicking different game version updates details", async ({ page }) => {
    const buttons = page.locator("[cy-data='game-ui-10000']");
    const count = await buttons.count();
    test.skip(count < 2, "Need at least 2 game versions");
    await buttons.nth(0).click();
    const firstDetails = await page.locator("[cy-data='game-ui-12000']").textContent();
    await buttons.nth(1).click();
    const secondDetails = await page.locator("[cy-data='game-ui-12000']").textContent();
    expect(firstDetails).not.toEqual(secondDetails);
  });
});
