require('dotenv').config()

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var prosRouter = require('./routes/pros')

var app = express();

const cors = require('cors')
app.use(cors())

const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Disable Express basic ETag
app.disable('etag');

// DB connection
const dbConnection = require('./middlewares/db-connection.middleware')
app.use(dbConnection)

// Check of the final status send
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`RESPONSE STATUS : ${res.statusCode}`);
  });
  next();
});

app.use('/users', usersRouter);
app.use('/pros', prosRouter)

module.exports = app;
