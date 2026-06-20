export function errorHandler(err, _req, res, _next) {
    console.error("[Error]", err.message);
    if (process.env.NODE_ENV === "development") {
        console.error(err.stack);
    }
    const statusCode = err.statusCode ?? 500;
    const code = err.code ?? "INTERNAL_SERVER_ERROR";
    const message = statusCode === 500 && process.env.NODE_ENV !== "development" ? "An unexpected error occurred" : err.message;
    res.status(statusCode).json({
        data: null,
        error: {
            code,
            message,
        },
    });
}
export function createError(statusCode, message, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}
//# sourceMappingURL=error-handler.js.map