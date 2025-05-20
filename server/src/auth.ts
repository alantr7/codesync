import { NextFunction, Request, Response } from "express";
import { config } from "./config";
import jwt from 'jsonwebtoken';

type Role = "explorer" | "codesync";
export function auth(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Not so strict authentication/authorization (explorer is read-only)
        if (roles.includes("explorer")) {
            const token = req.headers.authorization;
            if (typeof token === 'string' && verify(token)) {
                next();
                return;
            }
        }

        // Strict authentication/authorization
        if (roles.includes("codesync")) {
            const authtoken = req.headers.authorization;
            if (authtoken === undefined) {
                res.sendStatus(401);
                return;
            }

            if (authtoken !== config.authtoken) {
                res.sendStatus(403);
                return;
            }

            next();
            return;
        }

        res.sendStatus(403);
    }
}

function verify(bearer: string) {
    const token = bearer.substring("Bearer ".length);
    return jwt.verify(token, config.secret)
}

export function authenticate(password: string): string | undefined {
    if (password !== config.explorer_password) {
        return undefined;
    }

    return jwt.sign({user: "alantr7"}, config.secret);
}