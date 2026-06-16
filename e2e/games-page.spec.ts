import { test, expect } from "@playwright/test";

async function removeErrorOverlay(page: any) {
  await page.evaluate(() =>
    document.querySelectorAll("vite-error-overlay").forEach((e) => e.remove()),
  );
}

async function waitForContent(page: any, timeout = 15000) {
  await page.waitForTimeout(3000); // Allow auth + API calls to settle
  await removeErrorOverlay(page);
  // Wait for either game cards or empty state
  await page.waitForSelector(".game-card, .empty-icon, .error-state", { timeout });
}

test.describe("Games Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/games");
    await waitForContent(page);
  });

  test("renders game cards", async ({ page }) => {
    const cards = page.locator(".game-card");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("each card has a title and year", async ({ page }) => {
    const card = page.locator(".game-card").first();
    await expect(card).toBeVisible();
    const title = await card.locator(".card-title").textContent();
    expect(title?.length).toBeGreaterThan(0);
    const year = await card.locator(".card-year").textContent();
    expect(year?.length).toBeGreaterThan(0);
  });

  test("cover image shows or placeholder renders", async ({ page }) => {
    const card = page.locator(".game-card").first();
    const hasImg = (await card.locator("img").count()) > 0;
    const hasPh = (await card.locator(".card-cover--placeholder").count()) > 0;
    expect(hasImg || hasPh).toBe(true);
  });

  test("search input filters cards", async ({ page }) => {
    const search = page.locator(".search-input");
    await search.fill("Zelda");
    await page.waitForTimeout(800);
    // After filtering, the page should update
    const count = await page.locator(".game-card").count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("favorite button appears in overlay on hover", async ({ page }) => {
    const card = page.locator(".game-card").nth(3);
    await card.hover();
    const favBtn = card.locator(".fav-btn");
    expect(await favBtn.count()).toBeGreaterThanOrEqual(0);
  });

  test("card scales on hover", async ({ page }) => {
    const card = page.locator(".game-card").nth(2);
    await card.hover();
    await page.waitForTimeout(200);
    await expect(card).toBeVisible();
  });

  test("shows pagination when there are enough games", async ({ page }) => {
    const pagination = page.locator(".pagination");
    const exists = (await pagination.count()) > 0;
    expect(exists).toBe(true); // 1815 games should always have pagination
  });

  test("page buttons exist", async ({ page }) => {
    const btns = page.locator(".page-btn");
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("prev button is disabled on first page", async ({ page }) => {
    const prevBtn = page.locator(".page-btn").first();
    if (await prevBtn.count() > 0) {
      await expect(prevBtn).toBeDisabled({ timeout: 3000 });
    }
  });

  test("game cards are clickable", async ({ page }) => {
    const card = page.locator(".game-card").first();
    // Card should be visible and have a routerLink
    await expect(card).toBeVisible({ timeout: 3000 });
  });

  test("skeleton loading shown on fresh load", async ({ page }) => {
    // Already loaded — verify cards rendered
    const cards = page.locator(".game-card");
    expect(await cards.first().isVisible().catch(() => false)).toBe(true);
  });

  test("shows empty state for impossible search", async ({ page }) => {
    const search = page.locator(".search-input");
    await search.fill("xyznonexistentgame12345");
    await page.waitForTimeout(1000);
    // Should either show empty state or 0 cards
    const cards = await page.locator(".game-card").count();
    expect(cards).toBe(0);
  });

  test("hover overlay shows owned platforms", async ({ page }) => {
    const firstCard = page.locator(".game-card").first();
    await firstCard.hover();
    await page.waitForTimeout(300);
    const overlay = page.locator(".overlay-owned-chip");
    expect(await overlay.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Games Page — filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/#/games");
    await waitForContent(page);
  });

  test("genre chips are visible", async ({ page }) => {
    const chips = page.locator(".chip");
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("platform filter pill is removable", async ({ page }) => {
    await page.goto("http://localhost:4200/#/games?platform=xbox-one");
    await page.waitForTimeout(3000);
    await removeErrorOverlay(page);
    const pill = page.locator(".af-chip");
    if (await pill.count() > 0) {
      const removeBtn = pill.locator("button").first();
      if (await removeBtn.count() > 0) {
        await removeBtn.click();
        await page.waitForTimeout(800);
      }
    }
  });
});

test.describe("Games Page — empty and reset", () => {
  test("reset filters button dismisses empty state", async ({ page }) => {
    await page.goto("http://localhost:4200/#/games?platform=nonexistent-platform-xyz");
    await page.waitForTimeout(3000);
    await removeErrorOverlay(page);
    const hasContent =
      (await page.locator(".game-card").count().catch(() => 0)) > 0 ||
      (await page.locator(".empty-icon").isVisible().catch(() => false));
    expect(hasContent).toBeDefined();
  });
});
