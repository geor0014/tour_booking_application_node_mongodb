const express = require('express');
const morgan = require('morgan')

const app = express();
//////////////////////////// middleware
// this if statement is for development mode only
if(process.env.NODE_ENV === 'development'){
    // morgan is a middleware that logs the request to the console
    app.use(morgan('dev'))
}
app.use(express.json())
app.use(express.static(`${__dirname}/public`))

/////////////////////////// routers 
const userRouter = require('./routes/userRoutes')
const tourRouter = require('./routes/tourRoutes')

app.use('/api/v1/tours',tourRouter)
app.use('/api/v1/users',userRouter)

module.exports = app;