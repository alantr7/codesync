import { NextFunction, Request, Response } from "express";
import { config } from "./config";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export type User = {
    username: string,
    authtoken: string,
    explorer_password: string,
    role: "user" | "admin"
};
export const users: Record<string, User> = {};
const ADMIN_USER: User = {
    username: "admin",
    authtoken: generateToken(32),
    explorer_password: generateToken(24),
    role: "admin"
}

console.log(`Admin Authtoken: ${ADMIN_USER.authtoken}`);
console.log(`Explorer Password: ${ADMIN_USER.explorer_password}`);

export type Role = "filetoken" | "explorer" | "codesync";
export function auth(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Not so strict authentication/authorization (explorer is read-only)
        if (roles.includes("explorer")) {
            const token = req.headers.authorization;
            let data: any;
            if (typeof token === 'string' && (data = verifyBearer(token))) {
                req.user = data.user;
                req.role = "explorer";

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

                Object.assign(req, { user: data.user, role: "filetoken" });

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

            const bearer = authtoken.substring("Bearer ".length);
            const user = Object.values(users).find(usr => usr.authtoken === bearer);
            if (user === undefined) {
                res.sendStatus(403);
                return;
            }

            req.user = user.username;
            req.role = "codesync";

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
    if (!bearer.startsWith("Bearer explorer_"))
        return undefined;

    const token = bearer.substring("Bearer explorer_".length);
    return parseJwt(token);
}

export function authenticate(username: string, password: string): string | undefined {
    if (password !== users[username]?.explorer_password) {
        return undefined;
    }

    return "explorer_" + jwt.sign({user: username}, config.secret);
}

function generateToken(length: number) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}