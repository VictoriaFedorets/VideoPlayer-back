import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env');
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface TokenPayload extends JwtPayload {
  id: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err) {
      return next(createHttpError(401, 'Invalid or expired token'));
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return next(createHttpError(401, 'User not found'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
