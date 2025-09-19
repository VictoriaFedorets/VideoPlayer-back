import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import router from './routers/index.js';

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.use(cors());

  app.use(cookieParser());

  app.get('/', (req, res) => res.json({ message: 'Hello world!' }));
  app.get('/test', (req, res) => {
    console.log('GET /test hit');
    res.json({ ok: true });
  });

  app.use(router);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
