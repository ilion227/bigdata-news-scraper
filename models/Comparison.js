const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({
	firstArticleTitle: String,
	firstArticleId: mongoose.SchemaTypes.ObjectId,
	secondArticleTitle: String,
	secondArticleId: mongoose.SchemaTypes.ObjectId,
	comparisons: Array,
}, {timestamps: true});

module.exports = mongoose.model('Comparison', comparisonSchema, 'comparisons');