import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import type { ObjectSchema } from 'joi';

export const validateBody =
  (schema: ObjectSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (err: unknown) {
      if (err instanceof Joi.ValidationError) {
        // Ошибки валидации Joi
        const error = createHttpError(400, 'BadRequestError', {
          data: {
            message: 'Bad request',
            errors: err.details, // массив ошибок от Joi
          },
        });
        next(error);
      } else {
        // Любая другая ошибка
        next(err);
      }
    }
  };
