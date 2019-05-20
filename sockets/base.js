const io = require('socket.io')();

io.fetchedArticles = (count) => {
	io.emit('fetchedArticles', {
		count,
	});
};

module.exports = io;
