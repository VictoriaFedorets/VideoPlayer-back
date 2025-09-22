import { Router } from 'express';
import authRouter from './auth.ts';

const router = Router();

router.use('/auth', authRouter);

export default router;
