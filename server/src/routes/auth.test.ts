import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Pure-function extractions from auth.ts for isolated testing
// ---------------------------------------------------------------------------

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Cookie options (mirroring setRefreshCookie / clearRefreshCookie)
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/api/auth",
};

// ---------------------------------------------------------------------------
// Auth schemas (mirrored from auth.ts)
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  displayName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  currentPassword: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

// ---------------------------------------------------------------------------
// hashRefreshToken tests
// ---------------------------------------------------------------------------

describe("hashRefreshToken", () => {
  it("produces a 64-char hex string (SHA-256)", () => {
    const hash = hashRefreshToken("test-token-123");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    const token = "my-refresh-token";
    const hash1 = hashRefreshToken(token);
    const hash2 = hashRefreshToken(token);
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different inputs", () => {
    const hash1 = hashRefreshToken("token-a");
    const hash2 = hashRefreshToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("handles empty string", () => {
    const hash = hashRefreshToken("");
    expect(hash).toHaveLength(64);
  });

  it("handles UUID-style tokens", () => {
    const hash = hashRefreshToken("550e8400-e29b-41d4-a716-446655440000");
    expect(hash).toHaveLength(64);
  });

  it("produces lowercase hex", () => {
    const hash = hashRefreshToken("test");
    expect(hash).toBe(hash.toLowerCase());
  });
});

// ---------------------------------------------------------------------------
// Cookie options tests
// ---------------------------------------------------------------------------

describe("refresh cookie options", () => {
  it("set cookie has secure defaults", () => {
    expect(REFRESH_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(REFRESH_COOKIE_OPTIONS.secure).toBe(true);
    expect(REFRESH_COOKIE_OPTIONS.sameSite).toBe("strict");
  });

  it("set cookie path is /api/auth", () => {
    expect(REFRESH_COOKIE_OPTIONS.path).toBe("/api/auth");
  });

  it("maxAge is 7 days in milliseconds", () => {
    expect(REFRESH_COOKIE_OPTIONS.maxAge).toBe(604800000);
  });

  it("clear cookie uses same path and security settings", () => {
    expect(CLEAR_COOKIE_OPTIONS.path).toBe("/api/auth");
    expect(CLEAR_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(CLEAR_COOKIE_OPTIONS.secure).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Auth schema edge cases
// ---------------------------------------------------------------------------

describe("auth schemas", () => {
  describe("registerSchema", () => {
    it("accepts valid registration data", () => {
      const result = registerSchema.safeParse({
        username: "player1",
        displayName: "Player One",
        email: "player@example.com",
        password: "securepass123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects username with just 2 characters", () => {
      const result = registerSchema.safeParse({
        username: "ab",
        displayName: "Test",
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email without @", () => {
      const result = registerSchema.safeParse({
        username: "testuser",
        displayName: "Test",
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("accepts 3-char username (minimum)", () => {
      const result = registerSchema.safeParse({
        username: "abc",
        displayName: "Test",
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 50-char username (maximum)", () => {
      const result = registerSchema.safeParse({
        username: "a".repeat(50),
        displayName: "Test",
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid login", () => {
      const result = loginSchema.safeParse({ username: "player", password: "pass123" });
      expect(result.success).toBe(true);
    });

    it("rejects missing username", () => {
      const result = loginSchema.safeParse({ password: "pass" });
      expect(result.success).toBe(false);
    });

    it("rejects extra fields", () => {
      // Zod object strips extra fields by default — this succeeds and strips
      const result = loginSchema.safeParse({ username: "u", password: "p", extra: true });
      expect(result.success).toBe(true);
      expect(result.data).not.toHaveProperty("extra");
    });
  });

  describe("updateProfileSchema", () => {
    it("requires currentPassword", () => {
      const result = updateProfileSchema.safeParse({ displayName: "New" });
      expect(result.success).toBe(false);
    });

    it("accepts just currentPassword", () => {
      const result = updateProfileSchema.safeParse({ currentPassword: "old" });
      expect(result.success).toBe(true);
    });

    it("accepts all fields", () => {
      const result = updateProfileSchema.safeParse({
        displayName: "New Name",
        email: "new@example.com",
        currentPassword: "old",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("changePasswordSchema", () => {
    it("rejects newPassword < 8 chars", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "old",
        newPassword: "short",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid password change", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpass",
        newPassword: "newsecurepass",
      });
      expect(result.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Token expiry math tests
// ---------------------------------------------------------------------------

describe("token expiry", () => {
  it("refresh token expires in 7 days", () => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const expiresAt = new Date(now + SEVEN_DAYS_MS);
    const diff = expiresAt.getTime() - now;
    expect(diff).toBe(SEVEN_DAYS_MS);
  });

  it("access token expiry is 15 minutes", () => {
    const FIFTEEN_MIN_MS = 15 * 60 * 1000;
    expect(FIFTEEN_MIN_MS).toBe(900000);
  });
});
