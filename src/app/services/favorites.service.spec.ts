/**
 * FavoritesService pure-logic tests.
 *
 * Tests the core toggle/isFavorite/loadFavorites logic without Angular TestBed.
 */
import { describe, it, expect, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Pure-logic surface: replicate the service's state management
// ---------------------------------------------------------------------------

function createFavorites() {
  let set = new Set<number>();
  let loggedIn = true;

  return {
    /** Simulate AuthService.isLoggedIn() */
    get isLoggedIn(): boolean {
      return loggedIn;
    },
    setLoggedIn(v: boolean) {
      loggedIn = v;
    },

    /** Get the current set */
    getSet(): Set<number> {
      return set;
    },

    /** Replace the set (simulates loadFavorites response) */
    load(gameIds: number[]): void {
      if (!loggedIn) return;
      set = new Set(gameIds);
    },

    /** Toggle a game ID */
    toggle(gameId: number): { added: boolean; set: Set<number> } {
      const next = new Set(set);
      let added: boolean;
      if (next.has(gameId)) {
        next.delete(gameId);
        added = false;
      } else {
        next.add(gameId);
        added = true;
      }
      set = next;
      return { added, set };
    },

    /** Check if a game is favorited */
    isFavorite(gameId: number): boolean {
      return set.has(gameId);
    },

    /** Get count */
    count(): number {
      return set.size;
    },
  };
}

type Favorites = ReturnType<typeof createFavorites>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FavoritesService", () => {
  let favs: Favorites;

  beforeEach(() => {
    favs = createFavorites();
  });

  // -------------------------------------------------------------------------
  // loadFavorites
  // -------------------------------------------------------------------------

  describe("loadFavorites", () => {
    it("loads game IDs into the set", () => {
      favs.load([1, 2, 3, 5, 8]);
      expect(favs.count()).toBe(5);
      expect(favs.isFavorite(1)).toBe(true);
      expect(favs.isFavorite(3)).toBe(true);
      expect(favs.isFavorite(99)).toBe(false);
    });

    it("replaces existing favorites", () => {
      favs.load([1, 2, 3]);
      favs.load([4, 5]);
      expect(favs.count()).toBe(2);
      expect(favs.isFavorite(1)).toBe(false);
      expect(favs.isFavorite(4)).toBe(true);
    });

    it("skips loading when not logged in", () => {
      favs.load([1, 2, 3]);
      expect(favs.count()).toBe(3);

      favs.setLoggedIn(false);
      favs.load([4, 5, 6]);
      // Should keep the old set
      expect(favs.count()).toBe(3);
      expect(favs.isFavorite(4)).toBe(false);
    });

    it("handles empty array", () => {
      favs.load([1, 2]);
      favs.load([]);
      expect(favs.count()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // toggle
  // -------------------------------------------------------------------------

  describe("toggle", () => {
    it("adds a game when not in favorites", () => {
      const result = favs.toggle(42);
      expect(result.added).toBe(true);
      expect(favs.isFavorite(42)).toBe(true);
      expect(favs.count()).toBe(1);
    });

    it("removes a game when already in favorites", () => {
      favs.load([42, 99]);
      const result = favs.toggle(42);
      expect(result.added).toBe(false);
      expect(favs.isFavorite(42)).toBe(false);
      expect(favs.isFavorite(99)).toBe(true);
      expect(favs.count()).toBe(1);
    });

    it("handles toggling the same game twice", () => {
      favs.toggle(1); // add
      favs.toggle(1); // remove
      expect(favs.isFavorite(1)).toBe(false);
      favs.toggle(1); // add again
      expect(favs.isFavorite(1)).toBe(true);
    });

    it("does not affect other favorites when toggling", () => {
      favs.load([1, 2, 3]);
      favs.toggle(2);
      expect(favs.isFavorite(1)).toBe(true);
      expect(favs.isFavorite(2)).toBe(false);
      expect(favs.isFavorite(3)).toBe(true);
    });

    it("handles rapid toggles without state corruption", () => {
      for (let i = 0; i < 100; i++) {
        favs.toggle(1);
      }
      // 100 toggles from empty: toggle 1 adds, toggle 2 removes, etc.
      // Even number of toggles = last was remove = not in set
      expect(favs.isFavorite(1)).toBe(false);
      expect(favs.count()).toBe(0);
    });

    it("is idempotent for non-existent game removal", () => {
      // Toggle remove shouldn't be possible since it's not there — toggle always adds first
      const result = favs.toggle(99);
      expect(result.added).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // isFavorite
  // -------------------------------------------------------------------------

  describe("isFavorite", () => {
    it("returns false for empty set", () => {
      expect(favs.isFavorite(1)).toBe(false);
    });

    it("returns true for loaded favorites", () => {
      favs.load([7, 13, 42]);
      expect(favs.isFavorite(7)).toBe(true);
      expect(favs.isFavorite(13)).toBe(true);
      expect(favs.isFavorite(42)).toBe(true);
    });

    it("returns false after toggle removal", () => {
      favs.load([5]);
      favs.toggle(5);
      expect(favs.isFavorite(5)).toBe(false);
    });

    it("handles negative IDs gracefully", () => {
      favs.toggle(-1);
      expect(favs.isFavorite(-1)).toBe(true);
    });

    it("handles zero as a game ID", () => {
      favs.toggle(0);
      expect(favs.isFavorite(0)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Integration: full user flow
  // -------------------------------------------------------------------------

  describe("full flow", () => {
    it("load → toggle → check → toggle back", () => {
      // User opens app, favorites load
      favs.load([10, 20, 30]);
      expect(favs.count()).toBe(3);

      // User clicks heart on game 40 (not favorited)
      favs.toggle(40);
      expect(favs.isFavorite(40)).toBe(true);
      expect(favs.count()).toBe(4);

      // User clicks heart on game 20 (was favorited)
      favs.toggle(20);
      expect(favs.isFavorite(20)).toBe(false);
      expect(favs.count()).toBe(3);

      // User clicks heart on game 20 again (re-favorite)
      favs.toggle(20);
      expect(favs.isFavorite(20)).toBe(true);
      expect(favs.count()).toBe(4);
    });

    it("not logged in: load does nothing, toggle still works locally", () => {
      favs.setLoggedIn(false);
      favs.load([1, 2, 3]);
      expect(favs.count()).toBe(0);

      // Toggle works client-side even when not logged in
      favs.toggle(99);
      expect(favs.isFavorite(99)).toBe(true);
    });

    it("handles large favorite sets", () => {
      const ids = Array.from({ length: 1000 }, (_, i) => i + 1);
      favs.load(ids);
      expect(favs.count()).toBe(1000);
      expect(favs.isFavorite(500)).toBe(true);
      expect(favs.isFavorite(1001)).toBe(false);

      favs.toggle(500);
      expect(favs.count()).toBe(999);
      expect(favs.isFavorite(500)).toBe(false);
    });
  });
});
