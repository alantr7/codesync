import { NextFunction, Request, Response } from "express";
import { config } from "./config";
import jwt from 'jsonwebtoken';

export type Role = "filetoken" | "explorer" | "codesync";
export function auth(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Not so strict authentication/authorization (explorer is read-only)
        if (roles.includes("explorer")) {
            const token = req.headers.authorization;
            if (typeof token === 'string' && verifyBearer(token)) {
                Object.assign(req, { role: "explorer" });

                next();
                return;
            }
        }

        // Short-lived file-read access tokens
        if (roles.includes("filetoken")) {
            const { fileId } = req.params;
            const { token } = req.query;
            if (fileId !== null && typeof token === "string") {
                const data = parseJwt(token);
                if (data === undefined || fileId !== data.file) {
                    res.sendStatus(403);
                    return;
                }

                Object.assign(req, { role: "filetoken" });

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

            Object.assign(req, { role: "codesync" });

            next();
            return;
        }

        res.sendStatus(403);
    }
}

export function parseJwt(token: string): any | undefined {
    try {
        return jwt.verify(token, config.secret, {complete: true})?.payload;
    } catch {
        return undefined;
    }
}

function verifyBearer(bearer: string) {
    const token = bearer.substring("Bearer ".length);
    return parseJwt(token) !== undefined;
}

export function authenticate(password: string): string | undefined {
    if (password !== config.explorer_password) {
        return undefined;
    }

    return jwt.sign({user: "alantr7"}, config.secret);
}