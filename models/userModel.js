const mongoose = require('mongoose');

const validator = require('validator');

const bcrypt = require('bcryptjs');

const crypto = require('crypto');

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
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
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
  passwordResetToken: String,
  passwordResetExpiresAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

/////////////////////////////////////////////////// COMMENTED OUT, BECAUSE SEED DATA IS ALREADY ENCRYPTED /////////////////////////////////////////////////
////////////////////////////////////////////////// UNCOMMENT THIS CODE IF YOU WANT TO ENCRYPT PASSWORDS /////////////////////////////////////////////////
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

// set passwordChangedAt property to current time if password is modified
userSchema.pre('save', function (next) {
  // the isNew property is true when a new document is created
  if (!this.isModified('password') || this.isNew) return next();

  // subtract 1 second from the current time to make sure that the passwordChangedAt property is always set after the token is issued
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  // check if the query has the active property set to false and if it does then don't return that document
  this.find({ active: { $ne: false } });
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

// instance method to create a password reset token
userSchema.methods.createPasswordResetToken = function () {
  // 32 is the length of the token in bytes and then we convert it to hex to get a string value
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypt the reset token and save it to the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // set the password reset token expiry time to 10 minutes
  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000;

  // return the unencrypted reset token
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
