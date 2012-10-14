var mongo = require('mongodb');
var util = require('util');
var model = require('./model');
var crypto = require('crypto');
var mu = require('mu2');
var url = require('url');
mu.root = __dirname + '../../../frontend/templates';

var mongo_server = new mongo.Server('localhost', 27017);
var db = new mongo.Db('tdp013-project', mongo_server);

// Open a connection to the database
db.open(function(err, db) {
	if(err) {
		console.log("Error connecting to database:\n" + err);
	}
});

function parse_post_data(request, callback) {
	var body = "";
	request.on("data", function(data) {
		body += data;
	});

	request.on("end", function() {
		var post_data = url.parse(request.url + "?" + body, true).query;
		callback(post_data);
	});
}

function base(req, res) {
	mu.clearCache();
	res.writeHead(200, {'Content-Type': 'text/html'});
	var stream = mu.compileAndRender("base.html");
	stream.pipe(res);
}

function index(req, res) {
	mu.clearCache();
	res.writeHead(200, {'Content-Type': 'text/html'});
	var stream = mu.compileAndRender("index.html");
	stream.pipe(res);
}

function valid(text) {
	return text != undefined && text.length > 0;
}

function valid_username(request, response) {
	var q = url.parse(request.url, true).query;
	if(typeof q["username"] == "undefined") {
		response.writeHead(200, {'Content-Type': 'application/json'});
		response.write(JSON.stringify({valid: false}));
		response.end();
		return;
	}

	model.username_exists(db, q.username, function(exists) {
		response.writeHead(200, {'Content-Type': 'application/json'});
		response.write(JSON.stringify({valid: !exists}));
		response.end();
	});
}

// User registration
function validate_register_input(fields, callback) {
	if(!valid(fields.first_name)) return callback(false);
	if(!valid(fields.last_name)) return callback(false);
	if(!valid(fields.username)) return callback(false);
	if(!valid(fields.password)) return callback(false);
	if(!valid(fields.password_repeat)) return callback(false);
	if(!valid(fields.email)) return callback(false);

	if(fields.password != fields.password_repeat)
		return callback(false);

	model.username_exists(db, fields.username, function(exists) {
		callback(!exists);
	});
}

function register(request, response) {
	parse_post_data(request, function(fields) {
		// Validate form
		validate_register_input(fields, function(valid) {
			if(!valid) {
				response.writeHead(200, {'Content-Type': 'application/json'});
				response.write(JSON.stringify({success: false}));
				response.end();
			} else {
				// Save user
				var user = fields;
				delete user["password_repeat"];

				// Hash the users password
				var salt = crypto.createHash('sha1').update(user.username).digest('hex');
				user.password = crypto.createHash('sha1').update(user.password + salt).digest('hex');

				// Add a logged in flag to the user
				user["logged_in"] = false;

				// Insert the user in the database
				model.register_user(db, fields, function(error, record) {
					if(error) {
						response.writeHead(200, {'Content-Type': 'application/json'});
						response.write(JSON.stringify({success: false}));
						response.end();
					} else {
						response.writeHead(200, {'Content-Type': 'application/json'});
						response.write(JSON.stringify({success: true}));
						response.end();
					}
				});
			}
		});
	});
}

function login(request, response) {
    parse_post_data(request, function(post_data) {
        var user = post_data;
		var salt = crypto.createHash('sha1').update(user.username).digest('hex');
		user.password = crypto.createHash('sha1').update(user.password + salt).digest('hex');

        model.validate_login(db, user, function(success, user_document) {
            if(!success) {
				response.writeHead(200, {'Content-Type': 'application/json'});
				response.write(JSON.stringify({success: false}));
				response.end();
			} else {
				// Update the database
				model.login_user(db, user, function(error) {
					response.writeHead(200, {'Content-Type': 'application/json'});
					response.write(JSON.stringify({
						success: !error,
						error: error,
						user_id: user_document._id
					}));
					response.end();
				});
		    }
        });
    });
}

function logout(request, response) {
	parse_post_data(request, function(post_data) {
		var user_id = post_data.user_id;
		console.log("logging out " + user_id);
		model.logout_user(db, user_id, function(error) {
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.write(JSON.stringify({success: !error}));
			response.end();
		});
	});
}

function profile_page(request, response) {
	mu.clearCache();

	// Get user
	var user_id = url.parse(request.url, true).query["user_id"];
	model.find_user_by_id(db, user_id, function(success, user) {
		if(!success) {
			response.writeHead(500);
			response.end();
			return;
		}

		response.writeHead(200, {'Content-Type': 'text/html'});
		var stream = mu.compileAndRender('logged_in.html', {user: user});
		stream.pipe(response);
	});
}

function wallposts(request, response) {
	mu.clearCache();

	// Get user
	var params = url.parse(request.url, true).query;
	var user_id;
	if(params["user_id"] != undefined)
		user_id = params["user_id"];
	else
		user_id = params["viewer_id"];

	model.find_user_by_id(db, user_id, function(success, user) {
		if(!success) {
			response.writeHead(500);
			response.end();
			return;
		}

		response.writeHead(200, {'Content-Type': 'text/html'});
		var can_post = user_id != params["viewer_id"];
		console.log("can_post: " + can_post);
		var stream = mu.compileAndRender('wallposts.mustache', {can_post: can_post});
		stream.pipe(response);
	});
}

function search_form(request, response) {
	mu.clearCache();
	response.writeHead(200, {'Content-Type': 'text/html'});
	var stream = mu.compileAndRender('search.mustache');
	stream.pipe(response);
}

function search(request, response) {
	parse_post_data(request, function(post_data) {
		var query = post_data.query;
		if(!query) {
			response.writeHead(400);
			response.end();
			return;
		}

		model.search_users(db, query, function(error, results) {
			var vars = {
				users: results,
				query: query,
				count: results.length
			};
			response.writeHead(200, {'Content-Type': 'text/html'});
			var stream = mu.compileAndRender('search_results.mustache', vars);
			stream.pipe(response);
		});
	});
}

function show_user(request, response, username) {
	console.log(username);
	if(!username) {
		response.writeHead(400);
		response.end();
		return;
	}

	model.find_user_by_username(db, username, function(success, user) {
		if(!success) {
			response.writeHead(500);
			response.end();
			return;
		}

		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write(user.first_name);
		response.end();
	});

}

function save_message(req, res) {
	var msg = url.parse(req.url, true).query['message'];
	if(typeof msg == 'undefined') {
		res.writeHead(400, {'Content-Type': 'text/html'});
		res.write("400 Bad Request - No message specified");
		res.end();
		return;
	}

	if(msg.length > 140) {
		res.writeHead(400, {'Content-Type': 'text/html'});
		res.write("400 Bad Request - Message too long");
		res.end();
		return;
	}

	db.collection("message", function(e, c) {
		c.insert({'message': msg, 'read': false}, function(e, result) {
			if(e) {
				res.writeHead(500, {'Content-Type': 'text/html'});
				res.write("500 Internal Server Error");
			} else {
				res.writeHead(200);
				var resp = JSON.stringify(result[0]);
				res.write(resp);
			}
			res.end();
		});
	});
}

function flag_message(req, res) {
	var msg_id = url.parse(req.url, true).query['id'];
	if(typeof msg_id == 'undefined' || msg_id.length != 24) {
		res.writeHead(400, {'Content-Type': 'text/html'});
		res.write("400 Bad Request");
		res.end();findOne({username: user.username}, function(error, dbUser) {
			callback(dbUser != null && user.password == dbUser.password);
        })
		return;
	}

	msg_id = new mongo.BSONPure.ObjectID(msg_id);
	db.collection("message", function(e, c) {
		c.update({_id: msg_id}, {$set: {read: true}}, function(find_err, msg_doc) {
			if(find_err) {
				res.writeHead(500, {'Content-Type': 'text/html'});
				res.write("500 Internal Server Error");
			} else {
				res.writeHead(200);
			}
			res.end();
		});
	});
}

function messages(req, res) {
	db.collection("message", function(e, c) {
		c.find().toArray(function(err, docs) {
			if(err) {
				res.writeHead(500, {'Content-Type': 'text/html'});
				res.write("500 Internal Server Error");
			} else {
				res.writeHead(200, {'Content-Type': 'application/json'});
				res.write(JSON.stringify(docs));
			}
			res.end();
		});
	});
}

exports.base = base;
exports.index = index;
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.valid_username = valid_username;
exports.profile_page = profile_page;
exports.wallposts = wallposts;
exports.search_form = search_form;
exports.search = search;
exports.show_user = show_user;
