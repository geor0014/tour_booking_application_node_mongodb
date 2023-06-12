const { promisify } = require('util');

const User = require('../models/userModel');

const catchAsync = require('../utils/catchAsync');

const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');

const signToken = id => {
  // create a token with the user id and secret key and return it
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); // 90 days
};

// function to create and send token to client
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  // create a token
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  }); // 201: Created
});

// function to login user and send token to client
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //  check if email and password are provided
  if (!email || !password) {
    //  we return because we don't want to go to the next middleware
    return next(new Error('Email and password are required'), 400);
  }

  // check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  // if user does not exist or password is incorrect
  if (!user || !(await user.correctPassword(password, user.password))) {
    //  we return because we don't want to go to the next middleware
    return next(new AppError('Incorrect email or password', 401));
  }

  // if everything is ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  }); // 200: OK
});

// function to protect routes from unauthenticated users
exports.protect = catchAsync(async (req, res, next) => {
  //  GET TOKEN AND CHECK IF IT EXISTS
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // if token does not exist then return error message
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  // VERIFY TOKEN
  // promisify(jwt.verify) returns a function which we call with token and secret key
  // we need to use promisify because jwt.verify does not return a promise but we want to use async await syntax instead of callback hell
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // CHECK IF USER STILL EXISTS
  // we use decoded.id because jwt.verify returns an object with id property
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does not exist anymore!',
        401,
      ),
    );
  }

  // CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
  if (currentUser.changedPasswordAfterTokenIssued(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// function to restrict access to certain routes based on user role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'lead-guide']
    // check if user role is in roles array
    if (!roles.includes(req.user.role)) {
      // the req.user.role is set in the protect middleware
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};
