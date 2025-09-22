import { prisma, User } from '../db/initPrismaConnection.ts';

interface CreateUserParams {
  name: string;
  email: string;
  hashedPassword: string;
}

export const createUser = async ({
  name,
  email,
  hashedPassword,
}: CreateUserParams): Promise<
  Pick<User, 'id' | 'name' | 'email' | 'createdAt'>
> => {
  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};
