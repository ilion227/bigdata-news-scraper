const Website = require('../models/Website');

var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', async function(req, res, next) {
	Website.find({}, (err, websites) => {
		if (err) return res.status(500).json({error: err});
		return res.render('pages/index', {layout: 'default', websites});
	});
});

module.exports = router;
