const cathAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) {
      // if key is in allowedFields array then add it to newObj example: newObj['name'] = obj['name']
      newObj[key] = obj[key];
    }
  });

  return newObj;
};

exports.getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
  });
};

exports.updateMe = cathAsync(async (req, res, next) => {
  // CREATE ERROR IF USER POSTS PASSWORD DATA
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }
  // UPDATE USER DOCUMENT
  const filteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = cathAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
  });
};
exports.deleteUser = factory.deleteOne(User);

exports.updateUser = factory.updateOne(User);
