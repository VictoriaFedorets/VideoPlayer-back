import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env');
}

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      return next(createHttpError(401, 'Authorization header missing'));
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer') {
      return next(
        createHttpError(401, 'Authorization header must be type Bearer'),
      );
    }

    // Проверяем JWT
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next(createHttpError(401, 'Invalid or expired token'));
    }

    // Ищем пользователя по id из JWT
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return next(createHttpError(401, 'User not found'));
    }

    req.user = user; // добавляем пользователя в req
    next();
  } catch (err) {
    next(err);
  }
};
