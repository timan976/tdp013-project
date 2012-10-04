var server = require('./server');
var router = require('./router');
var requestHandlers = require('./requestHandlers');

var handlers = {
	'/': {
		'method': 'GET',
		'callback': requestHandlers.index,
		'cors_enabled': true
	},
	'/save': {
		'method': 'GET',
		'callback': requestHandlers.save_message,
		'cors_enabled': true
	},
	'/flag': {
		'method': 'GET',
		'callback': requestHandlers.flag_message,
		'cors_enabled': true
	},
	'/getall': {
		'method': 'GET',
		'callback': requestHandlers.messages,
		'cors_enabled': true
	}
};

server.start(router.route, handlers);
