const Website = require('../models/Website');

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
	const websites = await Website.find({}).exec();

	res.render('pages/websites', {layout: 'default', websites});
});

module.exports = router;
