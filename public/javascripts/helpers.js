module.exports = {
	formatDate: function(date) {
		if (date) {
			return date.toLocaleString();
		} else {
			return '';
		}
	},
	getBestImage: function(images) {
		return images[images.length - 1];
	},
};