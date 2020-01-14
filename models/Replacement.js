const mongoose = require('mongoose');

const replacementSchema = new mongoose.Schema({
	key: String,
	replacement: String,
	info: String,
}, {timestamps: true});

module.exports = mongoose.model('Replacement', replacementSchema, 'replacements');