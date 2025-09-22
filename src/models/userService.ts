import { prisma, User } from '../db/initPrismaConnection.ts';

interface CreateUserParams {
  name: string;
  email: string;
  password: string;
}

type UserWithoutPassword = Omit<User, 'password'>;

export const createUser = async ({
  name,
  email,
  password,
}: CreateUserParams): Promise<UserWithoutPassword> => {
  const user = await prisma.user.create({
    data: { name, email, password },
  });

  // Убираем пароль из ответа
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const findUserByEmail = async (
  email: string,
): Promise<Pick<
  User,
  'id' | 'name' | 'email' | 'password' | 'createdAt'
> | null> => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      createdAt: true,
    },
  });
};
