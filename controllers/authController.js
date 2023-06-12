const { promisify } = require('util');

const User = require('../models/userModel');

const catchAsync = require('../utils/catchAsync');

const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');

const sendEmail = require('../utils/email');

const crypto = require('crypto');

const signToken = id => {
  // create a token with the user id and secret key and return it
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); // 90 days
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
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
  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
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

// function to update password for logged in user only
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // GET USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  // GENERATE RANDOM TOKEN
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // SEND IT TO USER'S EMAIL
  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Please try again later!',
        500,
      ),
    );
  }
});

// function to reset password after user forgot password and requested a reset token
exports.resetPassword = catchAsync(async (req, res, next) => {
  // GET USER BASED ON THE TOKEN
  // because the token is encrypted in the database, but not incypted in the user mail, we need to encrypt the token sent by the user and then compare it to the token in the database
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  // we find the user based on the hashed token and check if the token has not expired yet (passwordResetExpiresAt > Date.now())
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: Date.now() },
  });
  // IF TOKEN HAS NOT EXPIRED AND THERE IS A USER, SET THE NEW PASSWORD
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();
  // UPDATE CHANGEDPASSWORDAT PROPERTY FOR THE USER
  // LOG THE USER IN, SEND JWT
  createSendToken(user, 200, res);
});

// function to update password for logged in user only
exports.updatePassword = catchAsync(async (req, res, next) => {
  // GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password');
  // CHECK IF POSTED PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // IF SO, UPDATE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // LOG USER IN, SEND JWT
  createSendToken(user, 200, res);
});
