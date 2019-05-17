const Article = require('../models/Article');

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  const articles = await Article.find({}).exec();

  res.render('pages/articles', {articles: articles});
});

/* GET scraper info. */
router.get('/:id', async function(req, res, next) {
  Article.findById(req.params.id, function(err, article) {
    res.render('pages/article', {article: article.toObject()});
  });
});

module.exports = router;
