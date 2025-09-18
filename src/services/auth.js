import { createUser, findUserByEmail } from '../models/user.js';
import bcrypt from 'bcryptjs';

export const registerUser = async ({ name, email, password }) => {
  // 1. Проверяем, есть ли уже пользователь с таким email
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const error = new Error('User already exists');
    error.status = 409; // HTTP статус Conflict
    throw error;
  }

  // 2. Хешируем пароль перед сохранением
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Создаём пользователя через Prisma
  const user = await createUser({
    name,
    email,
    password: hashedPassword,
  });

  // 4. Возвращаем пользователя без пароля
  return user;
};
