import { describe, it, expect } from "vitest";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Replicated schemas from routes for isolated validation testing.
// These must stay in sync with the actual schema definitions in each route file.
// ---------------------------------------------------------------------------

// From games.ts
const createGameSchema = z.object({
  title: z.string().min(1).max(255),
  firstReleaseYear: z.number().int().min(1900).max(2100),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().url().max(500).optional().nullable(),
  seriesId: z.number().int().optional().nullable(),
  alternativeTitles: z.array(z.string()).optional(),
  genreIds: z.array(z.number().int()).optional(),
});

const updateGameSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  firstReleaseYear: z.number().int().min(1900).max(2100).optional(),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().url().max(500).optional().nullable(),
  seriesId: z.number().int().optional().nullable(),
  alternativeTitles: z.array(z.string()).optional(),
  genreIds: z.array(z.number().int()).optional(),
});

// From auth.ts
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

// Helpers
function validateSchema(schema: z.ZodSchema, body: unknown): { success: boolean; details?: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(body);
  if (result.success) return { success: true };
  return {
    success: false,
    details: result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  };
}

// =========================================================================
// createGameSchema
// =========================================================================

describe("createGameSchema", () => {
  it("accepts a valid game payload", () => {
    const result = validateSchema(createGameSchema, {
      title: "Super Mario 64",
      firstReleaseYear: 1996,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a full payload with all optional fields", () => {
    const result = validateSchema(createGameSchema, {
      title: "The Legend of Zelda",
      firstReleaseYear: 1986,
      description: "A classic adventure game",
      coverImageUrl: "https://example.com/cover.jpg",
      seriesId: 1,
      alternativeTitles: ["Zelda 1", "LoZ"],
      genreIds: [1, 2, 3],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = validateSchema(createGameSchema, {
      firstReleaseYear: 1996,
    });
    expect(result.success).toBe(false);
    expect(result.details?.some((d) => d.field === "title")).toBe(true);
  });

  it("rejects empty title", () => {
    const result = validateSchema(createGameSchema, {
      title: "",
      firstReleaseYear: 1996,
    });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 255 chars", () => {
    const result = validateSchema(createGameSchema, {
      title: "A".repeat(256),
      firstReleaseYear: 1996,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing firstReleaseYear", () => {
    const result = validateSchema(createGameSchema, {
      title: "Test Game",
    });
    expect(result.success).toBe(false);
    expect(result.details?.some((d) => d.field === "firstReleaseYear")).toBe(true);
  });

  it("rejects year before 1900", () => {
    const result = validateSchema(createGameSchema, {
      title: "Ancient Game",
      firstReleaseYear: 1800,
    });
    expect(result.success).toBe(false);
  });

  it("rejects year after 2100", () => {
    const result = validateSchema(createGameSchema, {
      title: "Future Game",
      firstReleaseYear: 2200,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer year", () => {
    const result = validateSchema(createGameSchema, {
      title: "Test",
      firstReleaseYear: 1996.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid cover URL", () => {
    const result = validateSchema(createGameSchema, {
      title: "Test",
      firstReleaseYear: 2000,
      coverImageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null for nullable fields", () => {
    const result = validateSchema(createGameSchema, {
      title: "Test",
      firstReleaseYear: 2000,
      description: null,
      coverImageUrl: null,
      seriesId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer seriesId", () => {
    const result = validateSchema(createGameSchema, {
      title: "Test",
      firstReleaseYear: 2000,
      seriesId: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects genreIds containing non-integers", () => {
    const result = validateSchema(createGameSchema, {
      title: "Test",
      firstReleaseYear: 2000,
      genreIds: [1, "two", 3],
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty arrays for optional array fields", () => {
    const result = validateSchema(createGameSchema, {
      title: "Test",
      firstReleaseYear: 2000,
      alternativeTitles: [],
      genreIds: [],
    });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// updateGameSchema
// =========================================================================

describe("updateGameSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = validateSchema(updateGameSchema, {});
    expect(result.success).toBe(true);
  });

  it("accepts a single field update", () => {
    const result = validateSchema(updateGameSchema, { title: "New Title" });
    expect(result.success).toBe(true);
  });

  it("accepts partial field updates", () => {
    const result = validateSchema(updateGameSchema, {
      title: "Updated",
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid title", () => {
    const result = validateSchema(updateGameSchema, { title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid year", () => {
    const result = validateSchema(updateGameSchema, { firstReleaseYear: 3000 });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// registerSchema
// =========================================================================

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = validateSchema(registerSchema, {
      username: "testuser",
      displayName: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects username shorter than 3 chars", () => {
    const result = validateSchema(registerSchema, {
      username: "ab",
      displayName: "Test",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username exceeding 50 chars", () => {
    const result = validateSchema(registerSchema, {
      username: "a".repeat(51),
      displayName: "Test",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty display name", () => {
    const result = validateSchema(registerSchema, {
      username: "testuser",
      displayName: "",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = validateSchema(registerSchema, {
      username: "testuser",
      displayName: "Test",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = validateSchema(registerSchema, {
      username: "testuser",
      displayName: "Test",
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 8-char password", () => {
    const result = validateSchema(registerSchema, {
      username: "testuser",
      displayName: "Test",
      email: "test@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// loginSchema
// =========================================================================

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    const result = validateSchema(loginSchema, {
      username: "testuser",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing username", () => {
    const result = validateSchema(loginSchema, { password: "test" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = validateSchema(loginSchema, { username: "test" });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// updateProfileSchema
// =========================================================================

describe("updateProfileSchema", () => {
  it("accepts just currentPassword", () => {
    const result = validateSchema(updateProfileSchema, {
      currentPassword: "oldpass",
    });
    expect(result.success).toBe(true);
  });

  it("accepts displayName update", () => {
    const result = validateSchema(updateProfileSchema, {
      displayName: "New Name",
      currentPassword: "oldpass",
    });
    expect(result.success).toBe(true);
  });

  it("rejects without currentPassword", () => {
    const result = validateSchema(updateProfileSchema, {
      displayName: "New Name",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty displayName", () => {
    const result = validateSchema(updateProfileSchema, {
      displayName: "",
      currentPassword: "pass",
    });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// changePasswordSchema
// =========================================================================

describe("changePasswordSchema", () => {
  it("accepts valid password change", () => {
    const result = validateSchema(changePasswordSchema, {
      currentPassword: "oldpass",
      newPassword: "newpassword123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short new password", () => {
    const result = validateSchema(changePasswordSchema, {
      currentPassword: "old",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing newPassword", () => {
    const result = validateSchema(changePasswordSchema, {
      currentPassword: "old",
    });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// validate() middleware response shape test
// =========================================================================

describe("validate middleware error shape", () => {
  it("produces correct error details format", () => {
    // Simulate the error shape the validate middleware builds
    const issues = [
      { path: ["title"], message: "Required", code: "invalid_type" as const },
      { path: ["firstReleaseYear"], message: "Expected number, received string", code: "invalid_type" as const },
    ];

    const details = issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));

    expect(details).toEqual([
      { field: "title", message: "Required", code: "invalid_type" },
      { field: "firstReleaseYear", message: "Expected number, received string", code: "invalid_type" },
    ]);
  });

  it("handles nested path segments", () => {
    const issues = [
      { path: ["address", "street"], message: "Required", code: "invalid_type" as const },
    ];

    const details = issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));

    expect(details[0].field).toBe("address.street");
  });
});
