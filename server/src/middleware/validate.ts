import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error = result.error as ZodError;
      const details = error.errors.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      res.status(400).json({
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body validation failed",
          details,
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
