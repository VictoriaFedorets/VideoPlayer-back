import createHttpError from 'http-errors';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';

import { prisma } from '../config/prisma.js'; // prisma client
import {
  accessTokenLifetime,
  refreshTokenLifetime,
} from '../constants/users.js';
import { SMTP, TEMPLATES_DIR } from '../constants/index.js';
import { env } from '../utils/env.js';
import { sendEmail } from '../utils/sendMail.js';
import {
  getUsernameFromGoogleTokenPayload,
  validateCode,
} from '../utils/googleOAuth2.js';
import { generateActivationToken } from '../utils/generateActivationToken.js';

/* ================= CREATE SESSION ================= */
const createSession = () => {
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
export const register = async (payload) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    throw createHttpError(
      409,
      'Email already in use. Please login or reset your password',
    );
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: { ...payload, password: hashPassword, isActive: false },
  });

  const activateToken = generateActivationToken(newUser.id, newUser.email);

  const confirmEmailTemplatePath = path.join(
    TEMPLATES_DIR,
    'confirm-email.html',
  );
  const templateSource = (
    await fs.readFile(confirmEmailTemplatePath)
  ).toString();
  const template = handlebars.compile(templateSource);

  const html = template({
    link: `${env('FRONTEND_DOMAIN')}/confirm-email?token=${activateToken}`,
  });

  try {
    await sendEmail({
      from: env(SMTP.SMTP_FROM),
      to: email,
      subject: 'Confirm your email',
      html,
    });
  } catch (error) {
    throw createHttpError(500, error.message || 'Email sending failed');
  }
};

/* ================= CONFIRM EMAIL ================= */
export const confirmEmail = async ({ token }) => {
  if (!token) throw createHttpError(400, 'Activation token required');

  try {
    const decoded = jwt.verify(token, env('JWT_SECRET'));

    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
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
export const login = async ({ email, password }) => {
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
export const refreshUserSession = async ({ sessionId, refreshToken }) => {
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
export const logout = (sessionId) =>
  prisma.session.delete({ where: { id: sessionId } });

/* ================= FIND HELPERS ================= */
export const findSession = (filter) =>
  prisma.session.findFirst({ where: filter });
export const findUser = (filter) => prisma.user.findFirst({ where: filter });

/* ================= RESET PASSWORD ================= */
export const requestResetToken = async (email) => {
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

export const resetPassword = async ({ token, password }) => {
  let entries;
  try {
    entries = jwt.verify(token, env('JWT_SECRET'));
  } catch {
    throw createHttpError(401, 'Token is expired or invalid.');
  }

  const user = await prisma.user.findUnique({
    where: { id: entries.sub, email: entries.email },
  });
  if (!user) throw createHttpError(404, 'User not found');

  const encryptedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: encryptedPassword },
  });
};
