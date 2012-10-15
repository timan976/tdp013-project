var server = require('./server');
var router = require('./router');
var requestHandlers = require('./requestHandlers');
var static_handler = require('./static_handler');

var handlers = {
	'/static/**': {
		'GET': static_handler.serve_static,
	},

	'/': {
		'GET': requestHandlers.base,
	},

	'/template/index': {
		'GET': requestHandlers.index,
	},

	'/register': {
		'POST': requestHandlers.register,
	},

   	'/login': {
		'POST': requestHandlers.login,
	},

   	'/logout': {
		'POST': requestHandlers.logout,
	},

	'/valid_username': {
		'GET': requestHandlers.valid_username,
	},

	'/template/home': {
		'GET': requestHandlers.homepage,
	},

	'/content/wall': {
		'GET': requestHandlers.wall,
	},

	'/content/search': {
		'GET': requestHandlers.search_form,
	},

	'/search': {
		'GET': requestHandlers.base,
		'POST': requestHandlers.search,
	},

	'/content/user/*': {
		'GET': requestHandlers.show_user,
	},

	'/user/*': {
		'GET': requestHandlers.base
	},

	'/content/wallposts': {
		'GET': requestHandlers.wallposts
	},

	'/save_wallpost': {
		'POST': requestHandlers.save_wallpost
	},

	'/add_friend': {
		'POST': requestHandlers.add_friend
	},

	'/friends': {
		'GET': requestHandlers.base
	},

	'/content/friends': {
		'GET': requestHandlers.friends
	}
};

server.start(router.route, handlers);
