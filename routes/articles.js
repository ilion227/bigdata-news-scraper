const Article = require('../models/Article');

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
	const articles = await Article.find({}).sort({'meta.publishedAt': 1}).exec();

	res.render('pages/articles', {layout: 'default', articles: articles});
});

router.get('/fetch', async function(req, res, next) {
	Article.find({}, (err, articles) => {
		if (err) return res.status(500).json({error: err});
		res.json({articles});
	});
});

module.exports = router;
