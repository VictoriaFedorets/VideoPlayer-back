import { prisma } from '../db/index.js';

export const createSession = async ({
  userId,
  accessToken,
  refreshToken,
  accessTokenValidUntil,
  refreshTokenValidUntil,
}) => {
  return prisma.session.create({
    data: {
      userId,
      accessToken,
      refreshToken,
      accessTokenValidUntil,
      refreshTokenValidUntil,
    },
  });
};

export const findSessionByRefreshToken = async (refreshToken) => {
  return prisma.session.findUnique({
    where: { refreshToken },
  });
};

export const deleteSessionById = async (id) => {
  return prisma.session.delete({
    where: { id },
  });
};

export const deleteSessionsByUserId = async (userId) => {
  return prisma.session.deleteMany({
    where: { userId },
  });
};
