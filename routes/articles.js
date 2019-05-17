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
  const article = await Article.find({_id: req.params.id}).exec();

  res.render('pages/article', {article: article});
});

module.exports = router;
