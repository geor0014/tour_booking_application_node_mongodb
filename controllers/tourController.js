//  we read the file here because we want to read it only once when the server starts and not every time we make a request
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`))
const Tour = require('../models/tourModel');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    // Build query
    ////////////////filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'field'];
    // delete elements that match array elements from query
    excludedFields.forEach(el => delete queryObj[el]);
    /////////////////advanced filtering
    let queryStr = JSON.stringify(queryObj);
    // this is a regular expression that matches gte, gt, lte, lt and replaces them with $gte, $gt, $lte, $lt
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Tour.find(JSON.parse(queryStr));
    ///////////////////////// sorting
    if (req.query.sort) {
      //  if there are multiple fields we split them by comma and join them by space
      const sortBy = req.query.sort.split(',').join(' ');
      //  if user specifies a sort query, we sort by that field
      query = query.sort(sortBy);
    } else {
      // otherwise we sort by createdAt field in descending order
      query = query.sort('-createdAt');
    }
    ///////////////////////// field limiting
    if (req.query.fields) {
      //  if there are multiple fields we split them by comma and join them by space
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v -createdAt');
    }
    ///////////////////////// pagination
    // if user specifies a page query, we limit the results to 10 and skip the first 10 * page - 1 results
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    // the formula for skip is (page - 1) * limit because if we are on page 2, we want to skip the first 10 results (page 1) and then show the next 10 results (limit)
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      // .countDocuments() is the same as .count() but it returns a promise
      const numberOfTours = await Tour.countDocuments();
      if (skip >= numberOfTours) throw new Error('This page does not exist');
    }
    // Execute query
    const tours = await query;
    // Send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const tour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};
