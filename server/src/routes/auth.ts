import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, refreshTokens } from "../db/schema.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { config } from "../config.js";
import { eq, and, or, sql } from "drizzle-orm";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateAccessToken(userId: number, username: string): string {
  return jwt.sign({ sub: userId, username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createRefreshToken(userId: number): Promise<string> {
  const token = uuidv4();
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth",
  });
}

// ---------------------------------------------------------------------------
// Validation schemas
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
// Routes
// ---------------------------------------------------------------------------

// POST /register
router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { username, displayName, email, password } = req.body;

    // Check uniqueness of username and email
    const existing = await db
      .select({ username: users.username, email: users.email })
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)))
      .limit(1);

    if (existing.length > 0) {
      const conflict = existing[0];
      if (conflict.username === username) {
        res.status(409).json({
          data: null,
          error: { code: "USERNAME_TAKEN", message: "Username is already taken" },
        });
        return;
      }
      res.status(409).json({
        data: null,
        error: { code: "EMAIL_TAKEN", message: "Email is already registered" },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    const [newUser] = await db.insert(users).values({ username, displayName, email, passwordHash }).returning({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
    });

    const accessToken = generateAccessToken(newUser.id, newUser.username);
    const refreshToken = await createRefreshToken(newUser.id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      data: {
        accessToken,
        user: newUser,
      },
      error: null,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }
});

// POST /login
router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (!user) {
      res.status(401).json({
        data: null,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" },
      });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({
        data: null,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" },
      });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.username);
    const refreshToken = await createRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    res.json({
      data: {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
        },
      },
      error: null,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }
});

// POST /refresh
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const token: string | undefined = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({
        data: null,
        error: { code: "NO_REFRESH_TOKEN", message: "Refresh token not provided" },
      });
      return;
    }

    const tokenHash = hashRefreshToken(token);

    const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).limit(1);

    if (!stored) {
      res.status(401).json({
        data: null,
        error: { code: "INVALID_REFRESH_TOKEN", message: "Invalid refresh token" },
      });
      return;
    }

    if (new Date() > stored.expiresAt) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
      res.status(401).json({
        data: null,
        error: { code: "EXPIRED_REFRESH_TOKEN", message: "Refresh token has expired. Please sign in again." },
      });
      return;
    }

    // Fetch user
    const [user] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, stored.userId))
      .limit(1);

    if (!user) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
      res.status(401).json({
        data: null,
        error: { code: "USER_NOT_FOUND", message: "User account not found" },
      });
      return;
    }

    // Rotate: delete old, issue new
    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));

    const accessToken = generateAccessToken(user.id, user.username);
    const newRefreshToken = await createRefreshToken(user.id);
    setRefreshCookie(res, newRefreshToken);

    res.json({ data: { accessToken }, error: null });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }
});

// POST /logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token: string | undefined = req.cookies?.refreshToken;
    if (token) {
      const tokenHash = hashRefreshToken(token);
      await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
    }

    clearRefreshCookie(res);

    res.json({ data: { message: "Logged out successfully" }, error: null });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }
});

// GET /me
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({
        data: null,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
      return;
    }

    res.json({ data: user, error: null });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }
});

// PUT /me
router.put("/me", authenticate, validate(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const { displayName, email, currentPassword } = req.body;

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId)).limit(1);

    if (!user) {
      res.status(404).json({
        data: null,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(403).json({
        data: null,
        error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" },
      });
      return;
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (email !== undefined) {
      // Check email uniqueness excluding current user
      const [existingEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), sql`${users.id} != ${user.id}`))
        .limit(1);

      if (existingEmail) {
        res.status(409).json({
          data: null,
          error: { code: "EMAIL_TAKEN", message: "Email is already registered" },
        });
        return;
      }
      updateData.email = email;
    }

    const [updated] = await db.update(users).set(updateData).where(eq(users.id, req.user!.userId)).returning({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
    });

    res.json({ data: updated, error: null });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }
});

// PUT /me/password
router.put("/me/password", authenticate, validate(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, req.user!.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({
        data: null,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(403).json({
        data: null,
        error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, req.user!.userId));

    res.json({ data: { message: "Password updated successfully" }, error: null });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }
});

// POST /dev-login — development convenience: auto-creates & logs in a dev user.
// If a user with ID 1 exists, uses that one so imported owned instances work.
router.post("/dev-login", async (_req: Request, res: Response) => {
  try {
    // Prefer user ID 1 (seed / import data owner), then any "dev" user
    let [user] = await db.select().from(users).where(eq(users.id, 1)).limit(1);

    if (!user) {
      [user] = await db.select().from(users).where(eq(users.username, "dev")).limit(1);
    }

    if (!user) {
      const passwordHash = await bcrypt.hash("dev", config.bcryptRounds);
      [user] = await db
        .insert(users)
        .values({
          username: "dev",
          displayName: "Dev User",
          email: "dev@localhost",
          passwordHash,
        })
        .returning();
    }

    const accessToken = generateAccessToken(user.id, user.username);
    const refreshToken = await createRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    res.json({
      data: {
        accessToken,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
        },
      },
      error: null,
    });
  } catch (error) {
    console.error("Dev-login error:", error);
    res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
    });
  }
});

export default router;
