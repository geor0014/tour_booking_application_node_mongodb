const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// Aggregation Pipeline Stages (https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/):
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numOfRatings: { $sum: '$ratingsQuantity' },
        numOfTours: { $sum: 1 }, // 1 for each document
        avgRtaing: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // 1 for ascending order
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// Aggregation Pipeline Stages (https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/):
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      // unwind deconstructs an array field from the input documents to output a document for each element
      $unwind: '$startDates',
    },
    {
      // match filters the documents to pass only the documents that match the specified condition(s) to the next pipeline stage
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), // greater than or equal to the first day of the year (January 1st)
          $lte: new Date(`${year}-12-31`), // less than or equal to the last day of the year (December 31st)
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // group by month
        numOfTourStarts: { $sum: 1 }, // 1 for each document
        tours: { $push: '$name' }, // push the name of the tour to the tours array
      },
    },
    {
      $addFields: { month: '$_id' }, // add a new field called month
    },
    {
      $project: {
        _id: 0, // hide the _id field
      },
    },
    {
      $sort: { numOfTourStarts: -1 }, // sort in descending order
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
