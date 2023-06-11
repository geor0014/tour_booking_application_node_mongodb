/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');

// Handle uncaught exceptions globally (e.g. undefined variable) - this is a safety net
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! ⚠️⚠️ Shutting down...');
  console.log(err);
  // exit the application
  process.exit(1);
});

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
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle unhandled promise rejections globally (e.g. DB connection error) - this is a safety net
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! ⚠️⚠️ Shutting down...');
  console.log(err);
  server.close(() => {
    // exit the application
    process.exit(1); // 0 = success, 1 = uncaught exception
  });
});
