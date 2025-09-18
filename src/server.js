import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(cookieParser());

  app.get('/', (req, res) => res.json({ message: 'Hello world!' }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
