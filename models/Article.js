const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
	site: String,
	title: String,
	author: String,
	summary: String,
	url: String,
	mainImage: String,
	type: String,
	generatedFeatures: {type: Boolean, default: false},
	images: [
		{
			url: String,
			features: {
				hog: Array,
				lbp: Array,
				lbp_u: Array,
				lbp_d: Array,
			},
		}],
	info: String,
	meta: {
		location: String,
		publishedAt: Date,
		modifiedAt: String,
		readingTime: String,
		thumbnailTag: String,
		thumbnailDescription: String,
	},
	processed: {
		title: String,
	},
}, {timestamps: true});

module.exports = mongoose.model('Article', articleSchema, 'articles');