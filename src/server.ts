import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { notFoundHandler } from './middlewares/notFoundHandler.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { logger } from './middlewares/logger.ts';
import router from './routers/index.ts';

// import { swaggerDocs } from './middlewares/swaggerDocs.ts';

export const createApp = () => {
  const app = express();

  // безопасность
  app.use(helmet());

  app.use(
    cors({
      origin: 'http://localhost:5173',
      credentials: true, // разрешение передавать куки
    }),
  );

  app.use(express.json());

  app.use(cookieParser());

  app.use(logger);

  // app.use('/api-docs', swaggerDocs());

  // Routes
  // app.get('/', (req: Request, res: Response) =>
  //   res.json({ message: 'Hello world!' }),
  // );

  app.use(router);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
