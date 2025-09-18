export const handleServerError = (error, data, next) => {
  error.status = error.status || 400;
  next(error);
};
