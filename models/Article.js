const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
	title: String,
	author: String,
	summary: String,
	content: String,
	url: String,
	images: [String],
	meta: {
		location: String,
		publishedAt: Date,
		modifiedAt: String,
		readingTime: String,
		thumbnailTag: String,
		thumbnailDescription: String,
	},
}, {timestamps: true});

module.exports = mongoose.model('Article', articleSchema, 'articles');