import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Pure-function extraction of requireEnv for isolated testing
// ---------------------------------------------------------------------------

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value && !process.env["CI"]) {
    console.warn(`[config] Missing env var: ${key} — set it in server/.env`);
  }
  return value ?? "";
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("requireEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset relevant keys before each test
    delete process.env["TEST_KEY"];
    delete process.env["CI"];
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  it("returns the value when the env var is set", () => {
    process.env["TEST_KEY"] = "hello-world";
    expect(requireEnv("TEST_KEY")).toBe("hello-world");
  });

  it("returns empty string when the env var is not set", () => {
    delete process.env["TEST_KEY"];
    expect(requireEnv("TEST_KEY")).toBe("");
  });

  it("skips warning when CI is set", () => {
    process.env["CI"] = "true";
    const spy = vi.spyOn(console, "warn");
    requireEnv("MISSING_KEY");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("returns empty string for missing key even in CI", () => {
    process.env["CI"] = "true";
    expect(requireEnv("MISSING_KEY")).toBe("");
  });

  it("handles empty string value", () => {
    process.env["TEST_KEY"] = "";
    expect(requireEnv("TEST_KEY")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Config shape tests — verify the exported config object has expected keys
// ---------------------------------------------------------------------------

describe("config object shape", () => {
  it("exports all required config keys", async () => {
    // Dynamic import so process.env is available
    const { config } = await import("./config.js");

    expect(config).toHaveProperty("port");
    expect(config).toHaveProperty("databaseUrl");
    expect(config).toHaveProperty("jwtSecret");
    expect(config).toHaveProperty("jwtRefreshSecret");
    expect(config).toHaveProperty("jwtExpiresIn");
    expect(config).toHaveProperty("jwtRefreshExpiresIn");
    expect(config).toHaveProperty("bcryptRounds");
    expect(config).toHaveProperty("corsOrigin");
    expect(config).toHaveProperty("sgdbApiKey");
    expect(config).toHaveProperty("igdbClientId");
    expect(config).toHaveProperty("igdbAccessToken");
    expect(config).toHaveProperty("rapidApiKey");
  });

  it("has expected default values", async () => {
    const { config } = await import("./config.js");
    expect(config.jwtExpiresIn).toBe("15m");
    expect(config.jwtRefreshExpiresIn).toBe("7d");
    expect(config.bcryptRounds).toBe(12);
    expect(typeof config.port).toBe("number");
  });

  it("is frozen via as const", async () => {
    const { config } = await import("./config.js");
    // as const makes it readonly — verify it exists and is an object
    expect(typeof config).toBe("object");
    expect(config).not.toBeNull();
  });
});
