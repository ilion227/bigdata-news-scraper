var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var sassMiddleware = require('node-sass-middleware');
var hbs = require('express-handlebars');

var hbsHelpers = require('./public/javascripts/helpers.js');

var articlesRouter = require('./routes/articles');
var usersRouter = require('./routes/users');
var scraperRouter = require('./routes/scraper');

var app = express();

app.set('view engine', 'hbs');
app.engine('hbs', hbs({
  extname: 'hbs',
  defaultView: 'main.hbs',
  helpers: hbsHelpers,
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/',
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(
    sassMiddleware({
      src: path.join(__dirname, 'public'),
      dest: path.join(__dirname, 'public'),
      indentedSyntax: true, // true = .sass and false = .scss
      sourceMap: true,
    }),
);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/articles', articlesRouter);
app.use('/users', usersRouter);
app.use('/scraper', scraperRouter);

mongoose.connect('mongodb://localhost:27017/news-scraper',
    {useNewUrlParser: true});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Mongoose connected!');
});

module.exports = app;
