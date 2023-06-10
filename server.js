/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');

const env = require('dotenv');
env.config({ path: './config.env' });
const app = require('./app');

mongoose
  .connect(process.env.DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connected successfully'));

const port = process.env.PORT || 3000;

//////////////////////////////////Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
