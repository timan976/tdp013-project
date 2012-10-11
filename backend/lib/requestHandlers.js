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
function valid_register_input(fields) {
	// TODO: Check if the username already exists
	
	if(!valid(fields.first_name)) return false;
	if(!valid(fields.last_name)) return false;
	if(!valid(fields.username)) return false;
	if(!valid(fields.password)) return false;
	if(!valid(fields.password_repeat)) return false;
	if(!valid(fields.email)) return false;

	if(fields.password != fields.password_repeat)
		return false;

	return true;
}

function register(request, response) {
	var body = "";
	request.on("data", function(chunk) {
		body += chunk;
	});

	request.on("end", function() {
		// Register user
		var fields = url.parse("/register?" + body, true).query;
		if(!valid_register_input(fields)) {
			response.end();
			return;
		}
		
		var user = fields;
		delete user["password_repeat"];

		// Hash the users password
		var salt = crypto.createHash('sha1').update(user.username).digest('hex');
		user.password = crypto.createHash('sha1').update(user.password + salt).digest('hex');

		model.register_user(db, fields, function(error, record) {
			if(error) {
				response.writeHead(500, {'Content-Type': 'application/json'});
				response.write(JSON.stringify({success: false}));
				response.end();
			} else {
				console.log("Registered user");
				response.writeHead(200, {'Content-Type': 'application/json'});
				response.write(JSON.stringify({success: true}));
				response.end();
			}
		});
	});
}

function login(request, response) {
    var body = "";
    request.on("data", function(chunk) {
        body += chunk;
    });
    
    request.on("end", function() {
        var fields = url.parse("/login?" + body, true).query;
        
        var user = fields;
	var salt = crypto.createHash('sha1').update(user.username).digest('hex');
	user.password = crypto.createHash('sha1').update(user.password + salt).digest('hex');

        model.login(db, fields, function(error, record) {
            if(error) {
		response.writeHead(500, {'Content-Type': 'application/json'});
		response.write(JSON.stringify({success: false}));
		response.end();
	    } else {
		response.writeHead(200, {'Content-Type': 'application/json'});
		response.write(JSON.stringify({success: true}));
		response.end();
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
exports.login = login;
