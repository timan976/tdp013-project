var mongo = require('mongodb');
var mongo_server = new mongo.Server('localhost', 27017);
var db = new mongo.Db('tdp013-project', mongo_server);

db.open(function(err, db) {
	if(err != undefined)
		console.log("Error connecting to database: " + err);
	else
		console.log("Opened a connection to the database");
});

function object_id(id) {
	if(typeof id == "string")
		return new mongo.BSONPure.ObjectID(id);
	
	return id;
}

function register_user(user, callback) {
	db.collection("user", function(error, collection) {
		collection.insert(user, function(error, record) {
			callback(error, record);
		});
	});
}

function username_exists(username, callback) {
	db.collection("user", function(error, collection) {
		collection.findOne({username: username}, function(e, doc) {
			callback(!!doc);
		});
	});
}

function validate_login(user, callback) {
    db.collection("user", function(error, collection) {
        collection.findOne({username: user.username}, function(error, dbUser) {
			callback(dbUser != null && user.password == dbUser.password, dbUser);
        });
    });
}

function login_user(user, callback) {
    db.collection("user", function(error, collection) {
        collection.update({username: user.username}, {$set: {logged_in: true}}, function(update_error, doc) {
			callback(error);
		});
    });
}

function logout_user(user_id, callback) {
    db.collection("user", function(error, collection) {
		var id = object_id(user_id);
        collection.update({_id: id}, {$set: {logged_in: false}}, function(update_error, doc) {
			callback(error);
		});
    });
}

function find_user(criteria, callback) {
	db.collection("user", function(error, collection) {
		collection.findOne(criteria, function(user_error, user_doc) {
			callback(!error && user_doc, user_doc);
		});
	});
}

function find_users_by_id(ids, callback) {
	var object_ids = [];
	for(var index in ids)
		object_ids.push(object_id(ids[index]));

	db.collection("user", function(error, collection) {
		collection.find({_id: {$in: object_ids}}, function(find_error, documents) {
			if(find_error) {
				callback(false, []);
			} else {
				documents.toArray(function(err, res) {
					callback(res && res.length, res);
				});
			}
		});
	});
}

function find_user_by_id(user_id, callback) {
	var id = object_id(user_id);
	find_user({_id: id}, callback);
}

function find_user_by_username(username, callback) {
	find_user({username: username}, callback);
}

function search_users(query, callback) {
	// TODO: This can probably be done in a better way.
	var q = query.replace(/'/g, "");
	var query_string = "(this.first_name + ' ' + this.last_name).toLowerCase().indexOf('" + q + "') != -1";
	query_string += "|| this.username.toLowerCase().indexOf('" + q + "') != -1";

	db.collection("user", function(error, collection) {
		collection.find({$where: query_string}, function(find_error, documents) {
			if(find_error) {
					callback(find_error, []);
			} else {
				documents.toArray(function(err, res) {
					callback(undefined, res);
				});
			}
		});
	});
}

function find_wallposts(criteria, callback) {
	db.collection("wallpost", function(error, collection) {
		collection.find(criteria, function(find_error, documents) {
			if(find_error) {
					callback(false, []);
			} else {
				documents.toArray(function(err, res) {
					callback(true, res);
				});
			}
		});
	});
}

function find_wallposts_to_user(user, callback) {
	find_wallposts({to_id: user._id}, callback);
}

function add_wallpost(from_id, to_id, post, callback) {
	db.collection("wallpost", function(error, collection) {
		// Wallposts also contain the username of the sender
		// so we need to fetch that before inserting the wallpost.
		find_user_by_id(from_id, function(success, user) {
			if(!success) {
				callback(false, undefined);
				return;
			}

			to_id = object_id(to_id);
			from_id = object_id(from_id);
			var name = user.first_name + " " + user.last_name;
			var wallpost_record = {
				from: name,
				from_username: user.username,
				from_id: from_id,
				to_id: to_id,
				post: post,
				date: new Date()
			};

			collection.insert(wallpost_record, function(post_error, wallpost_doc) {
				callback(!post_error && wallpost_doc, wallpost_doc);
			});
		})
	})
}

function add_friend(user_id, friend_id, callback) {
	user_id = object_id(user_id);
	friend_id = object_id(friend_id);
	db.collection("user", function(error, collection) {
		// Make sure the user exists
		collection.findOne({_id: user_id}, function(user_error, user) {
			if(user_error || !user) {
				callback(false);
				return;
			}

			// Make sure the friend exists
			collection.findOne({_id: friend_id}, function(friend_error, friend_user) {
				if(friend_error || !friend_user) {
					callback(false);
					return;
				}

				var friends = user.friends;
				var friend = {
					user_id: friend_user._id,
					username: friend_user.username,
					name: friend_user.first_name + " " + friend_user.last_name
				};

				// Make sure the two people aren't already friends
				collection.findOne({_id: user_id, friends: {$elemMatch: {user_id: friend_id}}}, function(find_error, match) {
					if(match) {
						callback(false);
						return;
					}

					// Finally add the friend to the users friends-list
					collection.update(user, {$addToSet: {friends: friend}}, function(update_error) {
						callback(!update_error);
					});
				})
			});
		});
	});
}

// Chat

function chat_member(user) {
	// Returns a structure representing
	// a chat member
	return {
		name: user.first_name + " " + user.last_name,
		username: user.username
	};
}

function create_chat(members, callback) {
	find_users_by_id(members, function(success, users) {
		if(!success) {
			console.log("Unable to find users for creating chat");
			return callback(false, null);
		}

		var chat_members = {};
		for(var index in users) {
			var user = users[index];
			chat_members[user._id] = chat_member(user);
		}

		db.collection("chat", function(error, collection) {
			collection.insert({members: chat_members, messages: []}, function(error, chat) {
				callback(!error && !!chat, chat[0]);
			});
		});
	});
}

function find_chat_by_id(chat_id, callback) {
	db.collection("chat", function(error, collection) {
		collection.findOne({_id: object_id(chat_id)}, function(find_error, chat) {
			callback(!find_error && chat, chat);
		});
	});
}

function save_message(message, chat_id, user_id, callback) {
	db.collection("chat", function(error, chat_collection) {
		find_user_by_id(user_id, function(success, user) {
			var message_object = {
				message: message,
				username: user.username,
				name: user.first_name + " " + user.last_name
			};

			var criteria = {_id: object_id(chat_id)};
			var update = {$addToSet: {messages: message_object}};
			chat_collection.update(criteria, update, function(error) {
				callback(!error, message_object);
			});
		});
	});
}

function add_chat_member(chat_id, user_id, callback) {
	db.collection("chat", function(error, chat_collection) {
		find_user_by_id(user_id, function(success, user) {
			if(!success)
				callback(false);

			console.log(user);
			find_chat_by_id(chat_id, function(success, chat) {
				var members = chat.members;
				members[user_id] = chat_member(user);
				var criteria = {_id: object_id(chat_id)};
				chat_collection.update(criteria, {$set: {members: members}}, function(error) {
					console.log(error);
					callback(!error);
				});
			})
		});
	});
}

exports.register_user = register_user;
exports.validate_login = validate_login;
exports.username_exists = username_exists;
exports.login_user = login_user;
exports.logout_user = logout_user;
exports.find_user_by_id = find_user_by_id;
exports.find_user_by_username = find_user_by_username;
exports.find_user = find_user;
exports.search_users = search_users;
exports.find_wallposts_to_user = find_wallposts_to_user;
exports.find_wallposts = find_wallposts;
exports.add_wallpost = add_wallpost;
exports.add_friend = add_friend;

exports.create_chat = create_chat;
exports.find_chat_by_id = find_chat_by_id;
exports.find_users_by_id = find_users_by_id;
exports.save_message = save_message;
exports.add_chat_member = add_chat_member;
