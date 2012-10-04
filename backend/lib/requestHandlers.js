var mongo = require('mongodb');
var mongo_server = new mongo.Server('localhost', 27017);
var db = new mongo.Db('tdp013', mongo_server);
var util = require('util');

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
exports.save_message = save_message;
exports.flag_message = flag_message;
exports.messages = messages;
