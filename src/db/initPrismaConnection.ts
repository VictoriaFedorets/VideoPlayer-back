import { PrismaClient } from '@prisma/client';
import type { Session, User } from '@prisma/client';

export const prisma = new PrismaClient();

export const initPrismaConnection = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

export type { Session, User };
