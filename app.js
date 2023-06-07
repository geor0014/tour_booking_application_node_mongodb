const express = require('express');
const morgan = require('morgan')

const app = express();
//////////////////////////// middleware
app.use(morgan('dev'))
app.use(express.json())
/////////////////////////// routers 
const userRouter = require('./routes/userRoutes')
const tourRouter = require('./routes/tourRoutes')

app.use('/api/v1/tours',tourRouter)
app.use('/api/v1/users',userRouter)

module.exports = app;