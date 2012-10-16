var io = require("socket.io");
var model = require("./model.js");
var mu = require("mu2");
mu.root = __dirname + '../../../frontend/templates';

// Key: user_id
// Value: socket
var sockets = {};

function bind(server) {
	io = io.listen(server);
	io.set('origins', 'localhost:80');

	io.sockets.on("connection", function(socket) {
		socket.on("init", function(data) {
			console.log("init");
			if(sockets[data.user_id])
				sockets[data.user_id].disconnect();

			socket.set("user_id", data.user_id);
			sockets[data.user_id] = socket;
		});

		socket.on("disconnect", function() {
			socket.get("user_id", function(error, user_id) {
				delete sockets[user_id];
			});
		});

		socket.on("create", function(data) {
			var user_id = data.user_id;
			var partner_id = data.partner_id;
			model.create_chat([user_id, partner_id], function(success, chat) {
				if(success) {
					socket.emit("created", chat._id);
					socket.join(JSON.stringify(chat._id));

					var partner_socket = sockets[partner_id];
					if(!partner_socket) {
						console.log("Unable to find partner socket.");
						return;
					}

					partner_socket.emit("added", chat._id);
					partner_socket.join(JSON.stringify(chat._id));
				}
			});
		});

		socket.on("message", function(data) {
			var message = data.message;
			var chat_id = data.chat_id;
			var user_id = data.user_id;

			console.log(message + " - " + chat_id + " - " + user_id);
			model.save_message(message, chat_id, user_id, function(success, message_object) {
				if(!success)
					return;

				var content = "";
				mu.compileAndRender("chat_message.mustache", message_object).on("data", function(data) {
					content += data;
				}).on("end", function() {
					io.sockets.in(JSON.stringify(chat_id)).emit("message", {
						content: content
					});
				});
			});
		});

		socket.on("rejoin", function(data) {
			socket.join(JSON.stringify(data.chat_id));
		});
	});
}

exports.bind = bind;
