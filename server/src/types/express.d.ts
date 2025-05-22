import { Request } from 'express';
import { Role } from '../auth';

declare module 'express-serve-static-core' {
  interface Request {
    user?: string,
    role?: Role;
  }
}