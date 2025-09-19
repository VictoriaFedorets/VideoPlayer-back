// prisma
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// constants
export const ONE_DAY = 24 * 60 * 60 * 1000;
export const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

// env
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env');
}
