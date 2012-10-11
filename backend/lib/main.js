var server = require('./server');
var router = require('./router');
var requestHandlers = require('./requestHandlers');

var handlers = {
	'/': {
		'GET': requestHandlers.index,
		'cors_enabled': true
	},
	'/register': {
		'POST': requestHandlers.register,
		'cors_enabled': true
	},
   	'/login': {
		'POST': requestHandlers.login,
		'cors_enabled': true
	},

	'/valid_username': {
		'GET': requestHandlers.valid_username,
		'cors_enabled': true
	}
};

server.start(router.route, handlers);
