import { Request, Response, NextFunction } from "express";
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
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map