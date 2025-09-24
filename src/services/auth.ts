import createHttpError from 'http-errors';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';

import { prisma } from '../db/initPrismaConnection.ts';
import {
  accessTokenLifetime,
  refreshTokenLifetime,
} from '../config/constants.ts';
import { generateAccessToken } from '../utils/tokens.ts';
import { SMTP, TEMPLATES_DIR, ONE_DAY } from '../config/constants.ts';
import { env } from '../utils/env.ts';
import { sendEmail } from '../utils/sendMail.ts';
import { generateActivationToken } from '../utils/generateActivationToken.ts';
import type {
  RegisterAuthDTO,
  LoginAuthDTO,
  ConfirmEmailAuthDTO,
  RequestResetEmailAuthDTO,
  ResetPasswordAuthDTO,
} from '../validation/auth.ts';

interface SessionData {
  accessToken: string;
  refreshToken: string;
  accessTokenValidUntil: Date;
  refreshTokenValidUntil: Date;
}

/* ================= CREATE SESSION ================= */
const createSession = (): SessionData => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + accessTokenLifetime),
    refreshTokenValidUntil: new Date(Date.now() + refreshTokenLifetime),
  };
};

/* ================= REGISTER ================= */
export const register = async (
  payload: RegisterAuthDTO,
): Promise<{ accessToken: string; user: any }> => {
  const { name, email, password } = payload;

  // Проверка существующего пользователя
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw createHttpError(409, 'User already exists');
  }

  // Хэшируем пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создаем нового пользователя
  const user = await prisma.user.create({
    data: {
      name: name || 'User',
      email,
      password: hashedPassword,
      emailConfirmed: false,
    },
  });

  // Генерация токенов
  const accessToken = generateAccessToken(user.id);
  const refreshToken = randomBytes(40).toString('hex');
  const refreshTokenValidUntil = new Date(Date.now() + ONE_DAY);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, refreshTokenValidUntil },
  });

  // Отправка письма с подтверждением (можно тоже вынести в отдельную утилиту)
  const confirmEmailTemplatePath = path.join(
    TEMPLATES_DIR,
    'confirm-email.html',
  );
  const templateSource = (
    await fs.readFile(confirmEmailTemplatePath)
  ).toString();
  const template = handlebars.compile(templateSource);

  const html = template({
    link: `${env(
      'FRONTEND_DOMAIN',
    )}/confirm-email?token=${generateActivationToken(user.id, user.email)}`,
  });

  try {
    await sendEmail({
      from: `VideoPlayer <${env('SMTP_FROM')}>`,
      to: email,
      subject: 'Confirm your email',
      html,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw createHttpError(500, message || 'Email sending failed');
  }

  return { accessToken, user };
};

/* ================= CONFIRM EMAIL ================= */
export const confirmEmail = async ({
  token,
}: ConfirmEmailAuthDTO): Promise<SessionData> => {
  if (!token) throw createHttpError(400, 'Activation token required');

  try {
    const decoded = jwt.verify(token, env('JWT_SECRET')) as {
      sub: string;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.sub) },
    });
    if (!user) throw createHttpError(404, 'User not found');
    if (user.isActive) throw createHttpError(400, 'Account already activated');

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });

    await prisma.session.deleteMany({ where: { userId: user.id } });

    const session = createSession();

    return prisma.session.create({
      data: { userId: user.id, ...session },
    });
  } catch {
    throw createHttpError(401, 'Token is expired or invalid.');
  }
};

/* ================= LOGIN ================= */
export const login = async (payload: LoginAuthDTO): Promise<SessionData> => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw createHttpError(401, 'Email or password invalid');

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) throw createHttpError(401, 'Email or password invalid');

  if (!user.isActive) {
    throw createHttpError(401, 'Please confirm your email first');
  }

  await prisma.session.deleteMany({ where: { userId: user.id } });

  const newSession = createSession();

  return prisma.session.create({
    data: { userId: user.id, ...newSession },
  });
};

/* ================= REFRESH SESSION ================= */
export const refreshUserSession = async ({
  sessionId,
  refreshToken,
}: {
  sessionId: number;
  refreshToken: string;
}): Promise<SessionData> => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, refreshToken },
  });

  if (!session) throw createHttpError(401, 'Session not found');
  if (Date.now() > session.refreshTokenValidUntil.getTime()) {
    throw createHttpError(401, 'Session expired');
  }

  await prisma.session.delete({ where: { id: session.id } });

  const newSession = createSession();

  return prisma.session.create({
    data: { userId: session.userId, ...newSession },
  });
};

/* ================= LOGOUT ================= */
export const logout = (sessionId: number) =>
  prisma.session.delete({ where: { id: sessionId } });

/* ================= RESET PASSWORD ================= */
export const requestResetToken = async ({
  email,
}: RequestResetEmailAuthDTO): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw createHttpError(404, 'User not found');

  const resetToken = jwt.sign({ sub: user.id, email }, env('JWT_SECRET'), {
    expiresIn: '15m',
  });

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );
  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();
  const template = handlebars.compile(templateSource);

  const html = template({
    name: user.name,
    link: `${env('FRONTEND_DOMAIN')}/reset-pwd?token=${resetToken}`,
  });

  await sendEmail({
    from: env(SMTP.SMTP_FROM),
    to: email,
    subject: 'Reset your password',
    html,
  });
};

export const resetPassword = async ({
  token,
  newPassword,
}: ResetPasswordAuthDTO): Promise<void> => {
  let decoded: JwtPayload & { sub: number; email: string };

  try {
    const decodedRaw = jwt.verify(token, env('JWT_SECRET'));
    if (typeof decodedRaw === 'string') {
      throw createHttpError(401, 'Token invalid');
    }
    decoded = decodedRaw as JwtPayload & { sub: number; email: string };
  } catch {
    throw createHttpError(401, 'Token is expired or invalid.');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub, email: decoded.email },
  });
  if (!user) throw createHttpError(404, 'User not found');

  const encryptedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: encryptedPassword },
  });
};
