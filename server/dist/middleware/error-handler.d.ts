import { Request, Response, NextFunction } from "express";
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}
export declare function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void;
export declare function createError(statusCode: number, message: string, code?: string): AppError;
//# sourceMappingURL=error-handler.d.ts.map