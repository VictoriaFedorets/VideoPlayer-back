import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import router from './routers/index.js';

// import { swaggerDocs } from './middlewares/swaggerDocs.js';

export const createApp = () => {
  const app = express();

  // безопасность
  app.use(helmet());

  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true, // разрешение передавать куки
    }),
  );

  app.use(express.json());

  app.use(cookieParser());

  // app.use('/api-docs', swaggerDocs());

  // Routes
  app.get('/', (req, res) => res.json({ message: 'Hello world!' }));

  app.use(router);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
