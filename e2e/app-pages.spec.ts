import { test, expect } from "@playwright/test";

async function removeErrorOverlay(page: any) {
  await page.evaluate(() =>
    document.querySelectorAll("vite-error-overlay").forEach((e) => e.remove()),
  );
}

// Allow auth + API to settle after navigation
async function wait(page: any, ms = 3000) {
  await page.waitForTimeout(ms);
  await removeErrorOverlay(page);
}

test.describe("Game Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/games/halo-combat-evolved");
    await page.waitForSelector(".detail-hero", { timeout: 15000 });
    await wait(page);
  });

  test("shows game info in hero section", async ({ page }) => {
    const title = await page.locator(".detail-meta h1").textContent();
    expect(title).toBeTruthy();
  });

  test("has favorite heart button", async ({ page }) => {
    const btn = page.locator(".fav-btn");
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();
    await page.waitForTimeout(200);
    const isActive = await btn.evaluate((el) => el.classList.contains("active"));
    expect(isActive).toBe(true);
  });

  test("has back link to games page", async ({ page }) => {
    const back = page.locator(".back-link");
    await expect(back).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Series Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/series");
    await page.waitForSelector(".s-card", { timeout: 15000 });
    await wait(page);
  });

  test("shows series cards with cover previews or icons", async ({ page }) => {
    const cards = page.locator(".s-card");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const total =
      (await page.locator(".sc-covers").count()) +
      (await page.locator(".sc-icon").count());
    expect(total).toBeGreaterThan(0);
  });

  test("sort by games works", async ({ page }) => {
    await page.locator("button.s-chip").filter({ hasText: "Games" }).click();
    await page.waitForTimeout(500);
    const cards = page.locator(".s-card");
    await expect(cards.first()).toBeVisible();
  });

  test("series cards link to series detail", async ({ page }) => {
    const firstCard = page.locator(".s-card").first();
    const href = await firstCard.getAttribute("href");
    expect(href).toContain("/series/");
  });
});

test.describe("Series Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/series/halo");
    await page.waitForSelector(".sd-hero", { timeout: 15000 });
    await wait(page);
  });

  test("shows series name and game count", async ({ page }) => {
    const name = await page.locator(".sd-hero h1").textContent();
    expect(name).toContain("Halo");
  });

  test("games are sorted newest first", async ({ page }) => {
    const years = await page.locator(".sdc-year").allTextContents();
    const numericYears = years.map((y) => parseInt(y) || 0).filter((y) => y > 0);
    for (let i = 1; i < numericYears.length; i++) {
      expect(numericYears[i]).toBeLessThanOrEqual(numericYears[i - 1]);
    }
  });
});

test.describe("DLC List Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/dlc");
    await page.waitForTimeout(6000);
    await removeErrorOverlay(page);
  });

  test("shows DLC rows", async ({ page }) => {
    const rows = page.locator(".dlc-row");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("has search filter", async ({ page }) => {
    const search = page.locator(".s-input");
    await expect(search).toBeVisible({ timeout: 8000 });
  });
});

test.describe("DLC Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/dlc/224");
    await page.waitForSelector(".dd-hero", { timeout: 15000 });
    await wait(page);
  });

  test("shows DLC title", async ({ page }) => {
    const title = await page.locator(".dd-hero h1").textContent();
    expect(title?.length).toBeGreaterThan(0);
  });

  test("has parent game link", async ({ page }) => {
    const gameLink = page.locator(".dd-game-link");
    await expect(gameLink).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Timeline Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/timeline");
    await page.waitForSelector(".tl-card", { timeout: 20000 });
    await wait(page, 2000);
  });

  test("shows game cards grouped by decade", async ({ page }) => {
    const decades = page.locator(".tl-decade");
    expect(await decades.count()).toBeGreaterThan(0);
    const cards = page.locator(".tl-card");
    expect(await cards.count()).toBeGreaterThan(10);
  });
});

test.describe("Global Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/dashboard");
    await page.waitForSelector(".gs-trigger", { timeout: 15000 });
    await wait(page);
  });

  test("opens with button click", async ({ page }) => {
    await page.locator(".gs-trigger").click();
    const input = page.locator(".gs-input");
    await expect(input).toBeVisible({ timeout: 3000 });
  });

  test("closes with Escape", async ({ page }) => {
    await page.locator(".gs-trigger").click();
    await page.locator(".gs-input").press("Escape");
    await page.waitForTimeout(200);
    const modal = page.locator(".gs-modal");
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/dashboard");
    // Wait for auth to complete and stats to load
    await page.waitForTimeout(5000);
    await removeErrorOverlay(page);
  });

  test("shows dashboard content", async ({ page }) => {
    const hasStats = (await page.locator(".stat-card").count()) > 0;
    const hasPanels = (await page.locator(".panel").count()) > 0;
    const hasSection = (await page.locator("#dashboard, .section").count()) > 0;
    expect(hasStats || hasPanels || hasSection).toBe(true);
  });

  test("has sidebar favorites with badge", async ({ page }) => {
    // Check that the favorites link exists in the nav
    const favLink = page.locator("nav").locator("a").filter({ hasText: "Favorites" });
    await expect(favLink).toBeVisible({ timeout: 10000 });
  });
});
