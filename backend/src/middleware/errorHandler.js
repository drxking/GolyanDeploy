function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || res.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error(err);
  }

  const response = {
    success: false,
    message: isServerError ? 'Something went wrong. Please try again later.' : err.message || 'Something went wrong. Please try again.',
  };

  res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
