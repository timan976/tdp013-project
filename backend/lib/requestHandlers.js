var mongo = require('mongodb');
var util = require('util');
var model = require('./model');
var crypto = require('crypto');
var mu = require('mu2');
var url = require('url');
mu.root = __dirname + '../../../frontend/templates';

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

	model.username_exists(q.username, function(exists) {
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

	model.username_exists(fields.username, function(exists) {
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
				model.register_user(fields, function(error, record) {
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

        model.validate_login(user, function(success, user_document) {
            if(!success) {
				response.writeHead(200, {'Content-Type': 'application/json'});
				response.write(JSON.stringify({success: false}));
				response.end();
			} else {
				// Update the database
				model.login_user(user, function(error) {
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
		model.logout_user(user_id, function(error) {
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.write(JSON.stringify({success: !error}));
			response.end();
		});
	});
}

function homepage(request, response) {
	mu.clearCache();

	// Get user
	var user_id = request.headers["user-id"];
	model.find_user_by_id(user_id, function(success, user) {
		if(!success) {
			response.writeHead(500);
			response.end();
			return;
		}

		response.writeHead(200, {'Content-Type': 'text/html'});
		var stream = mu.compileAndRender('homepage.mustache', {user: user});
		stream.pipe(response);
	});
}

// The logged in users wall
function wall(request, response) {
	mu.clearCache();

	// Get user
	var user_id = request.headers["user-id"];
	model.find_user_by_id(user_id, function(success, user) {
		if(!success) {
			response.writeHead(500);
			response.end();
			return;
		}

		// Get wallposts
		model.find_wallposts_to_user(user, function(success, wallposts) {
			if(!success) {
				response.writeHead(500);
				response.end();
				return;
			}

			response.writeHead(200, {'Content-Type': 'text/html'});
			var stream = mu.compileAndRender('wall.mustache', {wallposts: wallposts});
			stream.pipe(response);
		});
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

		model.search_users(query, function(error, results) {
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

// Gets the wallposts to a specified user
function wallposts(request, response) {
	var params = url.parse(request.url, true).query;
	var user_id = params["user_id"];
	var ignore_user_id = params["ignore"];
	var last_updated = request.headers["if-modified-since"];
	
	var criteria = {
		to_id: new mongo.BSONPure.ObjectID(user_id),
		date: {$gt: new Date(last_updated)}
	};

	if(ignore_user_id != undefined) {
		criteria["from_id"] = {$ne: new mongo.BSONPure.ObjectID(ignore_user_id)};
	}

	model.find_wallposts(criteria, function(success, wallposts) {
		if(!success) {
			response.writeHead(500);
			response.end();
			return;
		}

		if(wallposts.length) {
			var content = "";
			mu.compileAndRender('wallposts.mustache', {wallposts: wallposts}).on('data', function(data) {
				content += data;
			}).on('end', function() {
				var last_updated = wallposts[wallposts.length - 1].date;
				var data = {
					content: content,
					last_updated: last_updated
				};

				response.writeHead(200, {'Content-Type': 'application/json'});
				response.write(JSON.stringify(data));
				response.end();
			});
		} else {
			response.end();
		}
	});
}

function show_user(request, response, username) {
	if(!username) {
		response.writeHead(400);
		response.end();
		return;
	}

	var viewer_id = request.headers["user-id"];
	model.find_user_by_username(username, function(success, user) {
		if(!success) {
			response.writeHead(500);
			response.end();
			return;
		}

		// Fetch viewer so we can check if the two people
		// are friends
		model.find_user_by_id(viewer_id, function(success, viewer) {
			if(!success) {
				response.writeHead(500);
				response.end();
				return;
			}

			var is_friend = false;
			for(var index in viewer.friends) {
				var friend = viewer.friends[index];
				if(friend.user_id.equals(user._id)) {
					is_friend = true;
					break;
				}
			}

			// Fetch wallposts
			model.find_wallposts_to_user(user, function(success, wallposts) {
				if(!success) {
					response.writeHead(500);
					response.end();
					return;
				}

				var can_post = viewer_id != user._id;
				var vars = {
					user: user,
					wallposts: wallposts,
					can_post: can_post,
					is_friend: is_friend
				};

				var html = "";
				mu.compileAndRender('user_page.mustache', vars).on('data', function(data) {
					html += data.toString();
				}).on('end', function() {
					response.writeHead(200, {'Content-Type': 'application/json'});
					var data = {
						content: html,
						user_id: user._id
					};
					response.write(JSON.stringify(data));
					response.end();
				});
			});
		});

	});

}

function save_wallpost(request, response) {
	parse_post_data(request, function(post_data) {
		var from_id = request.headers["user-id"];
		var to_id = post_data["to_id"];
		var post = post_data["post"];
		if(post.trim().length == 0) {
			response.writeHead(400);
			return response.end();
		}

		model.add_wallpost(from_id, to_id, post, function(success, wallpost) {
			if(!success) {
				response.writeHead(500);
				response.end();
				return;
			}

			response.writeHead(200, {'Content-Type': 'text/html'});
			var stream = mu.compileAndRender('wallpost.mustache', wallpost);
			stream.pipe(response);
		});
	});
}

function add_friend(request, response) {
	parse_post_data(request, function(post_data) {
		var user_id = request.headers["user-id"];
		var friend_id = post_data["friend_id"];

		model.add_friend(user_id, friend_id, function(success) {
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.write(JSON.stringify({success: success}));
			response.end();
		});
	});
}

function friends(request, response) {
	var user_id = request.headers["user-id"];
	model.find_user_by_id(user_id, function(success, user) {
		if(!success) {
			response.writeHead(500);
			response.end();
			return;
		}

		response.writeHead(200, {'Content-Type': 'text/html'});
		var stream = mu.compileAndRender("friends.mustache", {friends: user.friends});
		stream.pipe(response);
	});
}

function chat(request, response, chat_id) {
	if(!chat_id) {
		response.writeHead(500);
		return response.end();
	}

	model.find_chat_by_id(chat_id, function(success, chat) {
		if(!success) {
			response.writeHead(500);
			return response.end();
		}

		var user_id = request.headers["user-id"];
		model.find_user_by_id(user_id, function(success, user) {
			var member_list = [];
			for(var k in chat.members)
				member_list.push(chat.members[k]);
			member_list[member_list.length - 1].is_last = true;

			var friends = [];
			for(var f in user.friends) {
				var friend = user.friends[f];
				if(chat.members[friend.user_id] == undefined)
					friends.push(friend);
			}

			console.log(friends);

			var data = {
				chat: chat,
				member_list: member_list,
				friends: friends,
				has_friends: friends.length > 0
			};

			var stream = mu.compileAndRender("chat.mustache", data);
			stream.pipe(response);
		});
	});
}

exports.base = base;
exports.index = index;
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.valid_username = valid_username;
exports.homepage = homepage;
exports.wall = wall;
exports.search_form = search_form;
exports.search = search;
exports.show_user = show_user;
exports.save_wallpost = save_wallpost;
exports.wallposts = wallposts;
exports.add_friend = add_friend;
exports.friends = friends;
exports.chat = chat;
