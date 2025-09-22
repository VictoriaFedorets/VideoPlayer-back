import path from 'path';
import { env } from '../utils/env.ts';
import { fileURLToPath } from 'url';

// prisma
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// constants
export const ONE_DAY: number = 24 * 60 * 60 * 1000;
export const emailRegexp: RegExp =
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
// Время жизни Access Token в миллисекундах (например, 15 минут)
export const accessTokenLifetime = 15 * 60 * 1000; // 15 минут
// Время жизни Refresh Token в миллисекундах (например, 7 дней)
export const refreshTokenLifetime = 7 * 24 * 60 * 60 * 1000; // 7 дней

// env
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1h';
export const JWT_SECRET: string = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env');
}

// SMTP настройки
export const SMTP = {
  SMTP_HOST: env('SMTP_HOST'),
  SMTP_PORT: Number(env('SMTP_PORT')), // приводим к числу
  SMTP_USER: env('SMTP_USER'),
  SMTP_PASS: env('SMTP_PASS'),
  SMTP_FROM: env('SMTP_FROM'),
};

// Для писем
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const TEMPLATES_DIR = path.resolve(__dirname, '../templates');
