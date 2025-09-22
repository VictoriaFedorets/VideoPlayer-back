import Joi from 'joi';
import { emailRegexp } from '../config/constants.ts';

// ---------- Типы ----------
export interface RegisterAuthDTO {
  name?: string;
  email: string;
  password: string;
}

export interface LoginAuthDTO {
  email: string;
  password: string;
}

export interface ConfirmEmailAuthDTO {
  token: string;
}

export interface RequestResetEmailAuthDTO {
  email: string;
}

export interface ResetPasswordAuthDTO {
  newPassword: string;
  token: string;
}

// ---------- Joi-схемы ----------
export const registerAuthSchema = Joi.object<RegisterAuthDTO>({
  name: Joi.string().optional(),
  email: Joi.string().pattern(emailRegexp).trim().lowercase().required(),
  password: Joi.string().min(8).max(64).required(),
});

export const loginAuthSchema = Joi.object<LoginAuthDTO>({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(64).required(),
});

export const confirmEmailAuthSchema = Joi.object<ConfirmEmailAuthDTO>({
  token: Joi.string().required(),
});

export const requestResetEmailAuthSchema = Joi.object<RequestResetEmailAuthDTO>(
  {
    email: Joi.string().email().trim().lowercase().required(),
  },
);

export const resetPasswordAuthSchema = Joi.object<ResetPasswordAuthDTO>({
  newPassword: Joi.string().required(),
  token: Joi.string().required(),
});
