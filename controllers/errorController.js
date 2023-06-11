const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err, // error object
    message: err.message,
    stack: err.stack, // stack trace
  });
};

const sendErrorProd = (err, res) => {
  // operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR⚠️⚠️', err);
    // we don't want to leak error details to the client in production mode
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    }); // 500 is internal server error
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // if err.statusCode is undefined, then set it to 500
  err.status = err.status || 'error'; // if err.status is undefined, then set it to 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }
};
