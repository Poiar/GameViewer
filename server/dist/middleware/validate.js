export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const error = result.error;
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
//# sourceMappingURL=validate.js.map