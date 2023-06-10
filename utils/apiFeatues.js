class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    ////////////////filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'field'];
    // delete elements that match array elements from query
    excludedFields.forEach(el => delete queryObj[el]);
    /////////////////advanced filtering
    let queryStr = JSON.stringify(queryObj);
    // this is a regular expression that matches gte, gt, lte, lt and replaces them with $gte, $gt, $lte, $lt
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    ///////////////////////// sorting
    if (this.queryString.sort) {
      //  if there are multiple fields we split them by comma and join them by space
      const sortBy = this.queryString.sort.split(',').join(' ');
      //  if user specifies a sort query, we sort by that field
      this.query = this.query.sort(sortBy);
    } else {
      // otherwise we sort by createdAt field in descending order
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limit() {
    ///////////////////////// field limiting
    if (this.queryString.fields) {
      //  if there are multiple fields we split them by comma and join them by space
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v -createdAt');
    }

    return this;
  }

  paginate() {
    ///////////////////////// pagination
    // if user specifies a page query, we limit the results to 10 and skip the first 10 * page - 1 results
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    // the formula for skip is (page - 1) * limit because if we are on page 2, we want to skip the first 10 results (page 1) and then show the next 10 results (limit)
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
