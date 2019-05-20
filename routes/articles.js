const Article = require('../models/Article');

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

router.get('/:id', async function(req, res, next) {
	const article = await Article.findById(req.params.id).exec();

	res.render('pages/article', {layout: 'single', article});
});

module.exports = router;
