
function route(handlers, pathname, request, response) {
	var handler = handlers[pathname];
	var method = request.method;

	if(handler == undefined) {
		console.log("No request handler found for " + pathname);
		response.writeHead(404, {'Content-Type': 'text/html'});
		response.write("404 Not Found");
		response.end();
		return;
	}

	var date = new Date();
	console.log("[" + date.toString() + "] " + request.method + " " + pathname);

	// Enable CORS
	if(handler.cors_enabled == true) {
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
	}

	if(request.method != "OPTIONS" && typeof handler[method] != "function") {
		response.writeHead(405);
		response.end();
		return;
	}

	if(request.method == "OPTIONS")
		request.end();
	else
		handler[method](request, response);
}

exports.route = route;
