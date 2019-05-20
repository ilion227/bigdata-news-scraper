const io = require('socket.io')();

io.fetchedArticles = (data) => {
	io.emit('fetchedArticles', {
		...data,
	});
};

io.fetchedArticle = (data) => {
	io.emit('fetchedArticle', {
		...data,
	});
};

module.exports = io;
