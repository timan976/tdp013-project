/* Serves static files */

var fs = require("fs");
var ext = require("./ext").ext;

var STATIC_ROOT = __dirname + '/../../frontend/';
function serve_static(request, response, filename) {
	fs.readFile(STATIC_ROOT + filename, function(err, data) {
		if(err) {
			response.writeHead(404);
			response.end();
			return;
		}

		var content_type = ext.getContentType(ext.getExt(filename));
		response.writeHead(200, {'Content-Type': content_type});
		response.write(data);
		response.end();
	})
}

exports.serve_static = serve_static;
