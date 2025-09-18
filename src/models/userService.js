import { prisma } from './initPrismaConnection.js'; // твой prisma клиент

export const createUser = async ({ name, email, password }) => {
  const user = await prisma.user.create({
    data: { name, email, password },
  });
  // Убираем пароль из ответа
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true, // нужно для проверки при логине
      createdAt: true,
    },
  });
};
