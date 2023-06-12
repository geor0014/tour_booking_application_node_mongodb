const mongoose = require('mongoose');

const validator = require('validator');

const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
});

// encrypt password before saving to database
userSchema.pre('save', async function (next) {
  // check if password is modified or not if not then return next
  if (!this.isModified('password')) return next();

  // else if password is modified then hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // delete passwordConfirm field from database as it is only required for validation
  this.passwordConfirm = undefined;

  next();
});

// instance method to check if password is correct or not
// an instance method is a method that is available on all documents of a certain collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// instance method to check if user changed password after the token was issued
userSchema.methods.changedPasswordAfterTokenIssued = function (JWTimestamp) {
  if (this.passwordChangedAt) {
    const parsedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    // this will return true if password was changed after the token was issued
    // the comparison looks like this: 100 < 200
    return JWTimestamp < parsedTimestamp;
  }
  // false means password was not changed
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
