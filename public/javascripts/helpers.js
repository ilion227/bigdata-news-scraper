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
	getClassForCorrelation: function(value) {
		let correlationClass = "";

		if(value >= 0.8) correlationClass = "bg-translucent-success";
		else if(value >= 0.4 && value < 0.8) correlationClass = "bg-translucent-warning";
		else correlationClass = "bg-translucent-danger";

		return correlationClass;
	},
};