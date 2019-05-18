const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
	title: String,
	url: String,
	urlStartsWithDomain: Boolean,
	selectors: {
		tags: String,
		author: String,
		info: String,
		summary: String,
		content: String,
	},
	links: [String],
}, {timestamps: true});

module.exports = mongoose.model('Website', websiteSchema, 'websites');