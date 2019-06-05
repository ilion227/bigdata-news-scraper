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
	getClassForChi: function(value) {
		let correlationClass = "";

		if(value >= 0 && value < 4) correlationClass = "bg-translucent-success";
		else if(value >= 4 && value < 50) correlationClass = "bg-translucent-warning";
		else correlationClass = "bg-translucent-danger";

		return correlationClass;
	},
	getClassForIntersect: function(value) {
		let correlationClass = "";

		if(value >= 2.5) correlationClass = "bg-translucent-success";
		else if(value >= 2 && value < 2.5) correlationClass = "bg-translucent-warning";
		else correlationClass = "bg-translucent-danger";

		return correlationClass;
	},
	getClassForBhat: function(value) {
		let correlationClass = "";

		if(value >= 0 && value < 0.2) correlationClass = "bg-translucent-success";
		else if(value >= 0.2 && value < 0.35) correlationClass = "bg-translucent-warning";
		else correlationClass = "bg-translucent-danger";

		return correlationClass;
	},
};