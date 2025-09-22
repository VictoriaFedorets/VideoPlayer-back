import pinoHttp from 'pino-http';
import pino from 'pino';
import type { RequestHandler } from 'express';

let transport: any;

if (process.env.NODE_ENV === 'development') {
  // динамически импортируем pino-pretty для dev
  transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  };
}

export const logger: RequestHandler = pinoHttp({
  transport,
  logger: pino(),
});
