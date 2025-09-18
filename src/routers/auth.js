import { Router } from 'express';
import ctrlWrapper from '../utils/ctrlWrapper.js';
import { loginUserSchema, registerUserSchema } from '../validation/auth.js';
import {
  loginUserController,
  registerUserController,
} from '../controllers/authController.js';
import { validateBody } from '../middlewares/validateBody.js';

const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);

authRouter.post(
  '/login',
  validateBody(loginUserSchema),
  ctrlWrapper(loginUserController),
);

// authRouter.post('/logout', ctrlWrapper(logoutUserController));

// authRouter.post('/refresh', ctrlWrapper(refreshUserSessionController));

export default authRouter;
