export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}
export declare function createError(statusCode: number, message: string, code?: string): AppError;
//# sourceMappingURL=error-handler.test.d.ts.map