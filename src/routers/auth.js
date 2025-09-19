import { Router } from 'express';
import ctrlWrapper from '../utils/ctrlWrapper.js';
import {
  loginAuthSchema,
  registerAuthSchema,
  confirmEmailAuthSchema,
  requestResetEmailAuthSchema,
  resetPasswordAuthSchema,
} from '../validation/auth.js';
import {
  confirmEmailAuthController,
  loginAuthController,
  logoutAuthController,
  registerAuthController,
  requestResetEmailAuthController,
  resetPasswordAuthController,
  refreshSessionAuthController,
} from '../controllers/authController.js';
import { validateBody } from '../middlewares/validateBody.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerAuthSchema),
  ctrlWrapper(registerAuthController),
);

authRouter.post(
  '/confirm-email',
  validateBody(confirmEmailAuthSchema),
  ctrlWrapper(confirmEmailAuthController),
);

authRouter.post(
  '/login',
  validateBody(loginAuthSchema),
  ctrlWrapper(loginAuthController),
);

authRouter.post('/logout', ctrlWrapper(logoutAuthController));

// обновление сессии
authRouter.post('/refresh', ctrlWrapper(refreshSessionAuthController));

// запрос сброса пароля(отправка письма)
authRouter.post(
  '/send-reset-email',
  validateBody(requestResetEmailAuthSchema),
  ctrlWrapper(requestResetEmailAuthController),
);

// сброс пароля
authRouter.post(
  '/reset-pwd',
  validateBody(resetPasswordAuthSchema),
  ctrlWrapper(resetPasswordAuthController),
);

export default authRouter;
