var mongoose = require('mongoose');

var articleSchema = new mongoose.Schema({
  url: String,
  title: String,
  shortTitle: String,
  shortDescription: String,
  images: [String],
  data: Object,
});

module.exports = mongoose.model('Article', articleSchema, 'articles');