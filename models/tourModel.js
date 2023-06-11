/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');

const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true, // remove all white spaces in the beginning and end of the string
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxGroupSize'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true, // remove all white spaces in the beginning and end of the string
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true, // remove all white spaces in the beginning and end of the string
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a imageCover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
  },
  {
    toJSON: { virtuals: true }, // when data is outputted as JSON (e.g. when we send data to the client), we want the virtual properties to be included
    toObject: { virtuals: true }, // when data is outputted as an object (e.g. when we console.log the data), we want the virtual properties to be included
  },
);

// we need to use a function here because we need the this keyword
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; // this refers to the current document
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() but not .insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { Lower: true });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
