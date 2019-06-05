const Article = require('../models/Article');

var PythonShell = require('python-shell');
var express = require('express');
var router = express.Router();

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

router.get('/:id', async function(req, res, next) {
	const article = await Article.findById(req.params.id).exec();

	res.render('pages/article', {layout: 'single', article});
});

router.post('/compare/features', async function(req, res, next) {

	let {first_article_id, second_article_id} = req.body;

	PythonShell.PythonShell.run(__dirname + '/../external/test_compare.py',
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
