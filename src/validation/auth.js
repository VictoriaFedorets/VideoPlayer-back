import Joi from 'joi';

import { emailRegexp } from '../config/constants.js';

// signup
export const registerAuthSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(8).max(64).required(),
});

export const confirmEmailAuthSchema = Joi.object({
  token: Joi.string().required(),
});

// signin
export const loginAuthSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(64).required(),
});

export const requestResetEmailAuthSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordAuthSchema = Joi.object({
  password: Joi.string().required(),
  token: Joi.string().required(),
});
