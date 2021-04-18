const express = require("express");
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const hbs = require('hbs');

const path = require('path')
const app = express();

const port = process.env.NODE_ENV || 3000;

//database connection
require("./models/db");

//routes
const router = require('./router/index');

//express bodyparser
app.use(express.json());

// EJS
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','hbs');
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));

// Express session
app.use(
  session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// passport config
require('./config/passport')(passport);

//web user
app.use('/',router);
app.use('/users', require('./router/users'));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
      return res.status(200).json({});
    }
    next();
  });

  app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
  });
  
  app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
      error: {
        message: error.message
      }
    });
  });

//listen to port no 3000
app.listen(port , ()=>{
    console.log(`App running on port ${port}`)
})