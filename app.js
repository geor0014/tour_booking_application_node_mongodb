const express = require('express');

const morgan = require('morgan');

const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/errorController');

const rateLimit = require('express-rate-limit');

const helmet = require('helmet');

const app = express();

//////////////////////////// middleware
// this if statement is for development mode only
if (process.env.NODE_ENV === 'development') {
  // morgan is a middleware that logs the request to the console
  app.use(morgan('dev'));
}

// set security HTTP headers
app.use(helmet());

const limiter = rateLimit({
  // limit the number of requests from the same IP address
  max: 100, // 100 requests
  windowMs: 60 * 60 * 1000, // per hour (60 minutes * 60 seconds * 1000 milliseconds)
  message: 'Too many requests from this IP, please try again in an hour',
});

// apply the limiter middleware to all the routes that start with /api
app.use('/api', limiter);

// this middleware is used to parse the data from the body of the request
app.use(
  express.json({
    // this option is used to limit the amount of data that can be sent in the body of the request
    limit: '10kb',
  }),
);
// serve static files
app.use(express.static(`${__dirname}/public`));

/////////////////////////// routers
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// we put this middleware here because we want to run it after all the other routes are run and if none of the routes match, then we run this middleware
app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  // if we pass an argument to next(), then express will automatically assume that it is an error and will skip all the other middlewares and go straight to the error handling middleware
  next(err);
});

app.use(globalErrorHandler);

module.exports = app;
