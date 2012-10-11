var mongo = require('mongodb');
var util = require('util');
var model = require('./model');
var crypto = require('crypto');

var mongo_server = new mongo.Server('localhost', 27017);
var db = new mongo.Db('tdp013-project', mongo_server);

// Open a connection to the database
db.open(function(err, db) {
	if(err) {
		console.log("Error connecting to database:\n" + err);
	}
});

var url = require('url');

function index(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write("Hello, World!");
	res.end();
}

function valid(text) {
	return text != undefined && text.length > 0;
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
	var body = "";
	request.on("data", function(chunk) {
		body += chunk;
	});

	request.on("end", function() {
		// Validate form
		var fields = url.parse("/register?" + body, true).query;
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
						console.log("Registered user");
						response.writeHead(200, {'Content-Type': 'application/json'});
						response.write(JSON.stringify({success: true}));
						response.end();
					}
				});
			}
		});
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
		res.end();
		return;
	}

	msg_id = new mongo.BSONPure.ObjectID(msg_id);
	db.collection("message", function(e, c) {
		c.update({_id: msg_id}, {$set: {read: true}}, function(find_err, msg_doc) {
			if(find_err) {
				console.log(find_err);
				console.log(msg_doc);
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

exports.index = index;
exports.register = register;
