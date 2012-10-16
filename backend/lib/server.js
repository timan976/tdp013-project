var http = require("http")
var url = require("url")
var socket_server = require("./socket_server");

function start(route, handlers) {
	function onRequest(request, response) {
		var pathname = url.parse(request.url).pathname;
		route(handlers, pathname, request, response);
	}

	var server = http.createServer(onRequest).listen(80);
	socket_server.bind(server);
	console.log("Server started on http://localhost/");
}

exports.start = start;
