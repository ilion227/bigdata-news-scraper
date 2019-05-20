const Website = require('../models/Website');

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
	const websites = await Website.find({}).exec();

	res.render('pages/websites', {layout: 'single', websites});
});

/* GET home page. */
router.get('/:id', async function(req, res, next) {
	const website = await Website.findById(req.params.id).exec();

	res.render('pages/website', {layout: 'single', website});
});

module.exports = router;
