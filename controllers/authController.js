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
