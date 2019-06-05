const Comparison = require('../models/Comparison');

var express = require('express');
var router = express.Router();

router.get('/', async function(req, res, next) {
	const comparisons = await Comparison.find({}).exec();

	res.render('pages/comparisons', {layout: 'single', comparisons});
});

router.get('/:id', async function(req, res, next) {
	const comparison = await Comparison.findById(req.params.id).exec();

	res.render('pages/comparison', {layout: 'single', comparison});
});

module.exports = router;
