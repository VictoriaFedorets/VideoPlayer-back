import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const initPrismaConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
};
