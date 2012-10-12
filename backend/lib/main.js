var server = require('./server');
var router = require('./router');
var requestHandlers = require('./requestHandlers');
var static_handler = require('./static_handler');

var handlers = {
	'/static/**': {
		'GET': static_handler.serve_static,
		'cors_enabled': true
	},

	'/': {
		'GET': requestHandlers.base,
		'cors_enabled': true
	},

	'/template/index': {
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

   	'/logout': {
		'POST': requestHandlers.logout,
		'cors_enabled': true
	},

	'/valid_username': {
		'GET': requestHandlers.valid_username,
		'cors_enabled': true
	},

	'/template/profile_page': {
		'GET': requestHandlers.profile_page,
		'cors_enabled': true
	},

	'/content/wallposts': {
		'GET': requestHandlers.wallposts,
		'cors_enabled': true
	},

	'/content/search': {
		'GET': requestHandlers.search_form,
		'cors_enabled': true
	}
};

server.start(router.route, handlers);
