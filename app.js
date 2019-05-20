const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const sassMiddleware = require('node-sass-middleware');
const hbs = require('express-handlebars');

const hbsHelpers = require('./public/javascripts/helpers.js');

const dashboardRouter = require('./routes/dashboard');
const websitesRouter = require('./routes/websites');
const articlesRouter = require('./routes/articles');
const usersRouter = require('./routes/users');
const scraperRouter = require('./routes/scraper');

const app = express();

app.set('view engine', 'hbs');
app.engine('hbs', hbs({
	extname: 'hbs',
	defaultView: 'default.hbs',
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

app.use('/dashboard', dashboardRouter);
app.use('/articles', articlesRouter);
app.use('/websites', websitesRouter);
app.use('/users', usersRouter);
app.use('/scraper', scraperRouter);

mongoose.connect('mongodb://localhost:27017/news-scraper',
		{useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('Mongoose connected!');
});

module.exports = app;
