/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');

const slugify = require('slugify');

const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true, // remove all white spaces in the beginning and end of the string
      maxLength: [40, 'A tour name must have less or equal than 40 characters'],
      minLength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'], // validator is a third-party library that checks if the string only contains letters
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
      enum: {
        // enum means enumeration
        values: ['easy', 'medium', 'difficult'], // only these values are allowed for the difficulty field
        message: 'Difficulty is either: easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A tour must have a rating above 1.0'], // min and max only work for numbers
      max: [5, 'A tour must have a rating below 5.0'], // min and max only work for numbers
      set: val => Math.round(val * 10) / 10, // this will round the value to one decimal place (e.g. 4.666666666666667 will become 4.7)
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // custom validator
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price; // 100 < 200
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
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
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON is a special format for defining geospatial data (e.g. coordinates)
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], // only one value is allowed for the type field
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String, // type of the location
          default: 'Point',
          enum: ['Point'], // only one value is allowed for the type field
        },
        coordinates: [Number], // coordinates of the location
        address: String, // address of the location
        description: String, // description of the location
        day: Number, // day of the tour when the location is visited
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true }, // when data is outputted as JSON (e.g. when we send data to the client), we want the virtual properties to be included
    toObject: { virtuals: true }, // when data is outputted as an object (e.g. when we console.log the data), we want the virtual properties to be included
  },
);

// this will create an index for the price field in the database
tourSchema.index({
  // indexing is used to improve the performance of the database when we query data from it (e.g. when we search for a tour with a price of 200)
  price: 1, // 1 means ascending order, -1 means descending order
  ratingsAverage: -1,
});

tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere' }); // this will create a geospatial index for the startLocation field in the database

// we need to use a function here because we need the this keyword
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; // this refers to the current document
});

// VIRTUAL POPULATE
// this will populate the reviews field with the data from the Review model
tourSchema.virtual('reviews', {
  ref: 'Review', // the model to reference
  foreignField: 'tour', // the field in the Review model that will be used to match the current tour
  localField: '_id', // the field in the current tour that will be used to match the Review model
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() but not .insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { Lower: true });
  next();
});

//  this will run on all find queries (e.g. Tour.findOne(), Tour.find(), etc.) but not on findById()
tourSchema.pre(/^find/, function (next) {
  // this will populate the guides field with the data from the User model (e.g. name, email, etc.)
  this.populate({
    path: 'guides', // the field that we want to populate with data from the User model
    select: '-__v -passwordChangedAt', // exclude the __v and passwordChangedAt fields
  });
  next();
});

// QUERY MIDDLEWARE (e.g. Tour.find(), Tour.findOne(), Tour.findOneAndUpdate(), etc.): runs before the query is executed
tourSchema.pre(/^find/, function (next) {
  // /^find/ means that all the strings that start with find will be executed
  this.find({ secretTour: { $ne: true } });
  next();
});

// AGGREGATION MIDDLEWARE (e.g. Tour.aggregate()): runs before the aggregation is executed
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // unshift adds an element to the beginning of the array
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
