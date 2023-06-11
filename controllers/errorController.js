module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // if err.statusCode is undefined, then set it to 500
  err.status = err.status || 'error'; // if err.status is undefined, then set it to 'error'

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
