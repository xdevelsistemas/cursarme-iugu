require('newrelic');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var _ = require("lodash");
var flash = require('connect-flash');

var routes = require('./routes/index');
var routesDashboard = require('./routes/dashboard');
var userRoutes = require('./routes/userRoutes');


var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(session({
      secret: 'ilovescotchscotchyscotchscotch',
      resave: true,
      saveUninitialized: true
    })
);

// required for passport
passport = require('./config/passport')(passport); // pass passport for configuration
app.use(passport.initialize());
app.use(passport.session());// persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session



app.use(express.static(path.join(__dirname, 'public')));
userRoutes(app, passport);
app.use('/', routes);
app.use('/dashboard', routesDashboard);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
