import { Router } from 'express';
import ctrlWrapper from '../utils/ctrlWrapper.ts';
import {
  loginAuthSchema,
  registerAuthSchema,
  confirmEmailAuthSchema,
  requestResetEmailAuthSchema,
  resetPasswordAuthSchema,
} from '../validation/auth.ts';
import {
  confirmEmailAuthController,
  loginAuthController,
  logoutAuthController,
  registerAuthController,
  requestResetEmailAuthController,
  resetPasswordAuthController,
  refreshSessionAuthController,
  refreshAuthController,
} from '../controllers/authController.ts';
import { validateBody } from '../middlewares/validateBody.ts';

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
authRouter.post('/refresh-session', ctrlWrapper(refreshSessionAuthController));

authRouter.post('/refresh', ctrlWrapper(refreshAuthController));

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

// авторизованным пользователям
// router.get('/profile', authenticate, getProfileController);

export default authRouter;
