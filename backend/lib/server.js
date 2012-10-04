var http = require("http")
var url = require("url")

function start(route, handlers) {
	function onRequest(request, response) {
		var pathname = url.parse(request.url).pathname;
		route(handlers, pathname, request, response);
	}

	http.createServer(onRequest).listen(8888);
	console.log("Server started on http://localhost:8888/");
}

exports.start = start;
