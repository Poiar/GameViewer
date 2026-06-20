import { describe, it, expect } from "vitest";
export function createError(statusCode, message, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}
function buildErrorResponse(err, isProduction) {
    const statusCode = err.statusCode ?? 500;
    const code = err.code ?? "INTERNAL_SERVER_ERROR";
    const message = statusCode === 500 && isProduction ? "An unexpected error occurred" : err.message;
    return {
        statusCode,
        body: {
            data: null,
            error: { code, message },
        },
    };
}
// For testing, we also extract the error-code derivation
function getErrorCode(err) {
    return err.code ?? "INTERNAL_SERVER_ERROR";
}
function getStatusCode(err) {
    return err.statusCode ?? 500;
}
function getClientMessage(err, isProduction) {
    if (err.statusCode === 500 && isProduction) {
        return "An unexpected error occurred";
    }
    return err.message;
}
// ---------------------------------------------------------------------------
// createError tests
// ---------------------------------------------------------------------------
describe("createError", () => {
    it("creates an Error with statusCode and code", () => {
        const err = createError(404, "Not found", "NOT_FOUND");
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Not found");
        expect(err.statusCode).toBe(404);
        expect(err.code).toBe("NOT_FOUND");
    });
    it("creates an Error with only statusCode (code defaults to undefined)", () => {
        const err = createError(400, "Bad request");
        expect(err.statusCode).toBe(400);
        expect(err.code).toBeUndefined();
        expect(err.message).toBe("Bad request");
    });
    it("defaults to statusCode 500 when not provided", () => {
        // createError requires statusCode, but getStatusCode handles missing
        const err = new Error("Boom");
        expect(getStatusCode(err)).toBe(500);
    });
    it("creates error with various status codes", () => {
        expect(createError(400, "Bad").statusCode).toBe(400);
        expect(createError(401, "Unauthorized").statusCode).toBe(401);
        expect(createError(403, "Forbidden").statusCode).toBe(403);
        expect(createError(409, "Conflict").statusCode).toBe(409);
        expect(createError(500, "Internal").statusCode).toBe(500);
    });
});
// ---------------------------------------------------------------------------
// getErrorCode tests
// ---------------------------------------------------------------------------
describe("getErrorCode", () => {
    it("returns the error's code when set", () => {
        const err = createError(404, "Not found", "NOT_FOUND");
        expect(getErrorCode(err)).toBe("NOT_FOUND");
    });
    it("falls back to INTERNAL_SERVER_ERROR", () => {
        const err = createError(500, "Boom");
        expect(getErrorCode(err)).toBe("INTERNAL_SERVER_ERROR");
    });
    it("handles AppError interface without code property", () => {
        const err = new Error("Plain error");
        expect(getErrorCode(err)).toBe("INTERNAL_SERVER_ERROR");
    });
});
// ---------------------------------------------------------------------------
// getStatusCode tests
// ---------------------------------------------------------------------------
describe("getStatusCode", () => {
    it("returns the error's statusCode when set", () => {
        const err = createError(404, "Not found");
        expect(getStatusCode(err)).toBe(404);
    });
    it("falls back to 500 for plain errors", () => {
        const err = new Error("Plain error");
        expect(getStatusCode(err)).toBe(500);
    });
});
// ---------------------------------------------------------------------------
// getClientMessage tests
// ---------------------------------------------------------------------------
describe("getClientMessage", () => {
    it("returns the error message for non-500 errors in production", () => {
        const err = createError(404, "Not found");
        expect(getClientMessage(err, true)).toBe("Not found");
    });
    it("returns the error message for 500 errors in development", () => {
        const err = createError(500, "Database connection failed");
        expect(getClientMessage(err, false)).toBe("Database connection failed");
    });
    it("hides internal details for 500 errors in production", () => {
        const err = createError(500, "Database connection failed");
        expect(getClientMessage(err, true)).toBe("An unexpected error occurred");
    });
    it("shows message for 400 errors in production", () => {
        const err = createError(400, "Validation failed");
        expect(getClientMessage(err, true)).toBe("Validation failed");
    });
    it("shows message for 401 errors in production", () => {
        const err = createError(401, "Unauthorized");
        expect(getClientMessage(err, true)).toBe("Unauthorized");
    });
});
// ---------------------------------------------------------------------------
// buildErrorResponse tests (full response)
// ---------------------------------------------------------------------------
describe("buildErrorResponse", () => {
    it("builds a 404 response in production", () => {
        const err = createError(404, "Game not found", "NOT_FOUND");
        const res = buildErrorResponse(err, true);
        expect(res.statusCode).toBe(404);
        expect(res.body.data).toBeNull();
        expect(res.body.error).toEqual({ code: "NOT_FOUND", message: "Game not found" });
    });
    it("builds a 500 response in production (hidden details)", () => {
        const err = createError(500, "DB crash", "INTERNAL_ERROR");
        const res = buildErrorResponse(err, true);
        expect(res.statusCode).toBe(500);
        expect(res.body.error.message).toBe("An unexpected error occurred");
        expect(res.body.error.code).toBe("INTERNAL_ERROR");
    });
    it("builds a 500 response in development (full details)", () => {
        const err = createError(500, "DB crash", "INTERNAL_ERROR");
        const res = buildErrorResponse(err, false);
        expect(res.statusCode).toBe(500);
        expect(res.body.error.message).toBe("DB crash");
    });
    it("defaults status code for plain errors", () => {
        const err = new Error("Something went wrong");
        const res = buildErrorResponse(err, true);
        expect(res.statusCode).toBe(500);
        expect(res.body.error.code).toBe("INTERNAL_SERVER_ERROR");
    });
    it("builds a 400 validation error", () => {
        const err = createError(400, "Request body validation failed", "VALIDATION_ERROR");
        const res = buildErrorResponse(err, false);
        expect(res.statusCode).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
    it("error response always has null data", () => {
        const err = createError(403, "Forbidden", "FORBIDDEN");
        const res = buildErrorResponse(err, false);
        expect(res.body.data).toBeNull();
    });
});
//# sourceMappingURL=error-handler.test.js.map