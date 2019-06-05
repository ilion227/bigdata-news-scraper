const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({
	firstArticleId: ObjectId,
	secondArticleId: ObjectId,
	comparisons: Array,
}, {timestamps: true});

module.exports = mongoose.model('Comparison', comparisonSchema, 'comparisons');