/**
 * GamesService pure-logic tests.
 *
 * Tests query parameter building, slug handling, and API URL construction
 * without Angular TestBed or HttpClient.
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Pure-logic: HTTP parameter builder (mirrors ApiBaseService.get)
// ---------------------------------------------------------------------------

interface GameQueryParams {
  search?: string;
  genre?: string;
  seriesId?: number;
  platform?: string;
  provider?: string;
  sort?: "name" | "year" | "genre";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * Build URLSearchParams from GameQueryParams, filtering empty/undefined values.
 */
function buildQueryParams(params?: GameQueryParams): Record<string, string> {
  const result: Record<string, string> = {};
  if (!params) return result;

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      result[key] = String(value);
    }
  }
  return result;
}

/**
 * Build the API path for a game by slug or ID.
 */
function gameApiPath(identifier: string | number): string {
  return `/api/games/${identifier}`;
}

/**
 * Extract data from an API response wrapper.
 */
function extractData<T>(response: { data: T; error: unknown }): T {
  return response.data;
}

/**
 * Build pagination metadata.
 */
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ---------------------------------------------------------------------------
// buildQueryParams tests
// ---------------------------------------------------------------------------

describe("buildQueryParams", () => {
  it("returns empty object for undefined params", () => {
    expect(buildQueryParams(undefined)).toEqual({});
  });

  it("returns empty object for empty params", () => {
    expect(buildQueryParams({})).toEqual({});
  });

  it("converts all params to strings", () => {
    const params: GameQueryParams = {
      search: "Zelda",
      page: 2,
      limit: 20,
    };
    const result = buildQueryParams(params);
    expect(result).toEqual({ search: "Zelda", page: "2", limit: "20" });
  });

  it("filters out undefined values", () => {
    const params: GameQueryParams = {
      search: "Mario",
      genre: undefined,
      platform: undefined,
      page: 1,
    };
    const result = buildQueryParams(params);
    expect(result).toEqual({ search: "Mario", page: "1" });
    expect(result.genre).toBeUndefined();
    expect(result.platform).toBeUndefined();
  });

  it("filters out empty string values", () => {
    const params: GameQueryParams = {
      search: "",
      genre: "action",
    };
    const result = buildQueryParams(params);
    expect(result).toEqual({ genre: "action" });
    expect(result.search).toBeUndefined();
  });

  it("filters out null values", () => {
    const params: GameQueryParams = {
      search: "test",
      seriesId: null as unknown as number,
    };
    const result = buildQueryParams(params);
    expect(result).toEqual({ search: "test" });
  });

  it("includes sort and order params", () => {
    const params: GameQueryParams = {
      sort: "name",
      order: "asc",
    };
    expect(buildQueryParams(params)).toEqual({ sort: "name", order: "asc" });
  });

  it("includes all filter params", () => {
    const params: GameQueryParams = {
      search: "Final Fantasy",
      genre: "jrpg",
      platform: "ps1",
      provider: "physical",
      sort: "year",
      order: "desc",
      page: 3,
      limit: 50,
    };
    const result = buildQueryParams(params);
    expect(result).toEqual({
      search: "Final Fantasy",
      genre: "jrpg",
      platform: "ps1",
      provider: "physical",
      sort: "year",
      order: "desc",
      page: "3",
      limit: "50",
    });
    expect(Object.keys(result)).toHaveLength(8);
  });

  it("handles seriesId filter", () => {
    expect(buildQueryParams({ seriesId: 42 })).toEqual({ seriesId: "42" });
  });
});

// ---------------------------------------------------------------------------
// gameApiPath tests
// ---------------------------------------------------------------------------

describe("gameApiPath", () => {
  it("builds path for slug", () => {
    expect(gameApiPath("zelda-ocarina-of-time")).toBe("/api/games/zelda-ocarina-of-time");
  });

  it("builds path for numeric ID", () => {
    expect(gameApiPath(42)).toBe("/api/games/42");
  });
});

// ---------------------------------------------------------------------------
// extractData tests
// ---------------------------------------------------------------------------

describe("extractData", () => {
  it("extracts data from a successful response", () => {
    const response = { data: { id: 1, title: "Test" }, error: null };
    expect(extractData(response)).toEqual({ id: 1, title: "Test" });
  });

  it("extracts null data", () => {
    const response = { data: null, error: { code: "NOT_FOUND", message: "Not found" } };
    expect(extractData(response)).toBeNull();
  });

  it("extracts array data", () => {
    const response = { data: [{ id: 1 }, { id: 2 }], error: null };
    expect(extractData(response)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// buildPaginationMeta tests
// ---------------------------------------------------------------------------

describe("buildPaginationMeta", () => {
  it("calculates totalPages correctly", () => {
    const meta = buildPaginationMeta(1, 20, 100);
    expect(meta).toEqual({ page: 1, limit: 20, total: 100, totalPages: 5 });
  });

  it("rounds up partial pages", () => {
    const meta = buildPaginationMeta(1, 20, 101);
    expect(meta.totalPages).toBe(6);
  });

  it("handles single page", () => {
    const meta = buildPaginationMeta(1, 20, 5);
    expect(meta.totalPages).toBe(1);
  });

  it("handles zero total", () => {
    const meta = buildPaginationMeta(1, 20, 0);
    expect(meta.totalPages).toBe(0);
  });

  it("handles large page counts", () => {
    const meta = buildPaginationMeta(1, 25, 1815);
    expect(meta.totalPages).toBe(73); // Math.ceil(1815/25) = 73
  });
});
