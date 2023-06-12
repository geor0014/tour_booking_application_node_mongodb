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
const User = mongoose.model('User', userSchema);

module.exports = User;
