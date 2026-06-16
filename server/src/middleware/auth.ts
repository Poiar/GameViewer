import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
      };
    }
  }
}

interface JwtPayload {
  sub: number;
  username: string;
  iat?: number;
  exp?: number;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Provide a valid Bearer token.",
      },
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Provide a valid Bearer token.",
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as unknown as JwtPayload;
    req.user = {
      userId: decoded.sub,
      username: decoded.username,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        data: null,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Your session has expired. Please sign in again.",
        },
      });
      return;
    }

    res.status(401).json({
      data: null,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token.",
      },
    });
    return;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as unknown as JwtPayload;
    req.user = {
      userId: decoded.sub,
      username: decoded.username,
    };
  } catch {
    // Token is invalid or expired — continue without user
  }

  next();
}
