import { prisma, Session } from '../db/initPrismaConnection.ts';

interface CreateSessionParams {
  userId: number;
  accessToken: string;
  refreshToken: string;
  accessTokenValidUntil: Date;
  refreshTokenValidUntil: Date;
}

export const createSession = async ({
  userId,
  accessToken,
  refreshToken,
  accessTokenValidUntil,
  refreshTokenValidUntil,
}: CreateSessionParams): Promise<Session> => {
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

export const findSessionByRefreshToken = async (
  refreshToken: string,
): Promise<Session | null> => {
  return prisma.session.findUnique({
    where: { refreshToken },
  });
};

export const deleteSessionById = async (id: number): Promise<Session> => {
  return prisma.session.delete({
    where: { id },
  });
};

export const deleteSessionsByAuthId = async (
  userId: number,
): Promise<{ count: number }> => {
  return prisma.session.deleteMany({
    where: { userId },
  });
};
