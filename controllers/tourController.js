const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

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

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; // e.g. 233/34.111745,-118.113491/mi

  const [lat, lng] = latlng.split(','); // split the string into an array of strings

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // 3963.2 is the radius of the Earth in miles, 6378.1 is the radius of the Earth in kilometers

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const tour = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tour.length,
    data: {
      data: tour,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params; // e.g. 34.111745,-118.113491/mi

  const [lat, lng] = latlng.split(','); // split the string into an array of strings

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // 0.000621371 is the conversion factor from kilometers to miles, 0.001 is the conversion factor from meters to kilometers

  const distances = await Tour.aggregate([
    {
      // geoNear requires at least one of the fields in the collection to be a geospatial index and needs to be the first stage in the pipeline
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], // convert the strings to numbers
        },
        distanceField: 'distance', // the field that will contain the calculated distance
        distanceMultiplier: multiplier, // multiply the distance by the multiplier
      },
    },
    {
      // project specifies the fields to return in the documents that match the query
      $project: {
        distance: 1, // show the distance field
        name: 1, // show the name field
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
