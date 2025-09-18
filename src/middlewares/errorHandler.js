export const errorHandler = (err, req, res, next) => {
  const { status = 500, message = 'Something went wrong' } = err;

  res.status(status).json({
    status: status,
    message: message,
    data: err.data || {},
  });
};
