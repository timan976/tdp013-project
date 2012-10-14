
// Returns a handler that matches the given path
function match(handlers, request_path) {
	for(var route_path in handlers) {
		if(route_path.indexOf('*') != -1) {
			var regex_string = route_path.replace("**", "(([a-zA-Z._-]+/?)+)").replace(/\*/g, "([a-zA-Z._-]+)");
			var regex = new RegExp(regex_string, "i");
			var matches = request_path.match(regex);

			if(!matches)
				continue;

			if(matches[0] == request_path) {
				var params = [];
				if(matches.length > 2)
					params = matches.slice(1, matches.length - 1);
				else
					params = [matches[1]];
				return {
					handler: handlers[route_path],
					params: params
				};
			}
		} else {
			if(route_path == request_path) {
				return {
					handler: handlers[route_path],
					params: []
				};
			}
		}
	}
	return false;
}

function route(handlers, pathname, request, response) {
	var m = match(handlers, pathname);

	if(!m) {
		console.log("No request handler found for " + pathname);
		response.writeHead(404, {'Content-Type': 'text/html'});
		response.write("404 Not Found");
		response.end();
		return;
	}

	var handler = m.handler;
	var method = request.method;
	var args = [request, response];
	args.push.apply(args, m.params);

	var date = new Date();
	console.log("[" + date.toString() + "] " + request.method + " " + pathname);

	// Enable CORS
	if(handler["cors_enabled"] == true) {
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
		handler[method].apply(this, args);
}

exports.route = route;
