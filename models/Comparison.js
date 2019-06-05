const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({
	firstArticle:{
		id: ObjectId,
		url: String
	},
	secondArticle:{
		id: ObjectId,
		url: String
	},
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