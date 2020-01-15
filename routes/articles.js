const Article = require('../models/Article');
const Replacement = require('../models/Replacement');

const ObjectId = require('mongoose').Types.ObjectId;

let {PythonShell} = require('python-shell');
var express = require('express');
var router = express.Router();

// Serial Port
const SerialPort = require('serialport');

const fs = require('fs'),
		path = require('path'),
		util = require('util'),
		parse = require('csv-parse');

router.get('/', async function(req, res, next) {
	res.render('pages/articles', {layout: 'single'});
});

router.get('/fetch', async function(req, res, next) {
	Article.find({}, (err, articles) => {
		if (err) return res.status(500).json({error: err});
		res.json({articles});
	});
});

router.get('/compare', async function(req, res, next) {
	const articles = await Article.find({images: {$exists: true, $ne: []}, generatedFeatures: true}).exec();

	res.render('pages/compare', {layout: 'single', articles});
});

router.get('/machine-learning', async function(req, res, next) {

	let lines = [];
	let content = null;
	fs.readFile(path.join(__dirname, '/../external', 'wfl_sl.csv'), 'utf16le', function(err, data) {
		if (err) {
			console.log(err);
			res.json({message: 'Failed to open file', error: err});
			return;
		}
		console.log('Read ' + data.length + ' characters.');

		parse(data, {delimiter: ',', columns: ['key', 'replacement', 'info']}, function(err, output) {
			if (err) {
				console.log(err);
				res.json({message: 'Failed to parse', error: err});
				return;
			}

			let replacements = [];

			Replacement.deleteMany({}, function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log('Removed all replacements from MongoDB');
				}
			});

			output.forEach(function(line) {
				let replacement = new Replacement({
					key: line.key,
					replacement: line.replacement,
					info: line.info,
				});
				replacements.push(replacement);
			});

			Replacement.insertMany(replacements).then((result) => {
				console.log('success inserting');
				res.json({message: 'Success', data: {count: result.length}});
			}).catch(err => {
				console.error('error inserting', err);
			});
		});
	});
});

router.get('/:id', async function(req, res, next) {
	const article = await Article.findById(req.params.id).exec();

	res.render('pages/article', {layout: 'single', article});
});

router.get('/:id/send-serial', async function(req, res, next) {
	const article = await Article.findById(req.params.id).exec();

	console.log(article.type, ['good', 'neutral', 'bad'].indexOf(article.type));
	if (['good', 'neutral', 'bad'].indexOf(article.type) === -1) {
		return res.json({message: 'Article type missing!'});
	}

	const port = new SerialPort('COM5', function(err) {
		if (err) {
			return res.json({message: 'Failed to open serial port.', error: err});
		}
	});

	port.write(`${article.type}\n`, function(err) {
		if (err) {
			return res.json({message: 'Failed to send to serial.', error: err});
		}

		port.close();
		return res.json({message: `Sent "${article.type}" to serial.`});
	});

	if (port.isOpen) {
		port.close();
	}
});

router.get('/:id/process-type', function(req, res, next) {

	PythonShell.run(__dirname + '/../external/weka_main.py',
			{pythonOptions: ['-u'], args: [req.params.id]},
			function(err, data) {
				if (err) console.log(err);

				console.log('results: %j', data);
				let result = JSON.parse(data);

				res.json({'message': `Article type has been generated: "${result.type}"`, 'success': true});
			});
});

router.post('/compare/features', async function(req, res, next) {

	let {first_article_id, second_article_id} = req.body;

	PythonShell.run(__dirname + '/../external/test_compare.py',
			{pythonOptions: ['-u'], args: [first_article_id, second_article_id]},
			function(err, results) {
				if (err) throw err;

				console.log('results: %j', results);
			});

	res.json({'status': 'Comparing', first_article_id, second_article_id});
});

router.get('/:id', async function(req, res, next) {
	const article = await Article.findById(req.params.id).exec();

	res.render('pages/article', {layout: 'single', article});
});

router.get('/:id/generate', async function(req, res, next) {
	const article = await Article.findById(req.params.id).exec();

	PythonShell.PythonShell.run(__dirname + '/../external/generate_features.py',
			{pythonOptions: ['-u'], args: [article._id]},
			function(err, results) {
				if (err) throw err;

				console.log('results: %j', results);
			});

	res.json({'status': 'Generating...'});
});

module.exports = router;
