const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // parent referencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// indexing to prevent duplicate reviews from the same user for the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // each combination of tour and user must be unique so that a user can only write one review for a tour

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  }); // populate the user
  next();
});

// static method on the model to calculate the average rating of a tour from all the reviews of that tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this points to the model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // match the tour id of the current tour. hthis is the tour id that is passed in as an argument
    },
    {
      $group: {
        _id: '$tour', // group by tour
        nRating: { $sum: 1 }, // count the number of ratings
        avgRating: { $avg: '$rating' }, // calculate the average rating
      },
    },
  ]);

  if (stats.length > 0) {
    // persist the calculated stats to the tour document
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, // stats is an array with one element
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // if there are no reviews for a tour, then set the ratingsQuantity and ratingsAverage to 0
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// we use pre middleware because we want to calculate the average rating before the review is saved, otherwise the review will not be included in the calculation
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this is a hack to pass the tour id from the pre middleware to the post middleware
  this.r = await this.findOne(); // we execute the query and get the review document that is being updated or deleted
  next();
});

// we use post because the query has already executed and we have the review document that is being updated or deleted
reviewSchema.post(/^findOneAnd/, async function () {
  // we used the passed r from the pre middleware to calculate the average rating of the tour that the review belongs to
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// we use post middleware because we want to wait for the current review to be saved before we calculate the average rating
reviewSchema.post('save', function () {
  // this points to the current review document that is being saved
  this.constructor.calcAverageRatings(this.tour); // we need to use constructor because calcAverageRatings is a static method and is not available on the current document.
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
