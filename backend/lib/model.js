var mongo = require('mongodb');

function register_user(db, user, callback) {
	db.collection("user", function(error, collection) {
		collection.insert(user, function(error, record) {
			callback(error, record);
		});
	});
}

function username_exists(db, username, callback) {
	db.collection("user", function(error, collection) {
		collection.findOne({username: username}, function(e, doc) {
			callback(!!doc);
		});
	});
}

function validate_login(db, user, callback) {
    db.collection("user", function(error, collection) {
        collection.findOne({username: user.username}, function(error, dbUser) {
			callback(dbUser != null && user.password == dbUser.password, dbUser);
        });
    });
}

function login_user(db, user, callback) {
    db.collection("user", function(error, collection) {
        collection.update({username: user.username}, {$set: {logged_in: true}}, function(update_error, doc) {
			callback(error);
		});
    });
}

function logout_user(db, user_id, callback) {
    db.collection("user", function(error, collection) {
		var id = new mongo.BSONPure.ObjectID(user_id);
        collection.update({_id: id}, {$set: {logged_in: false}}, function(update_error, doc) {
			callback(error);
		});
    });
}

function find_user(db, criteria, callback) {
	db.collection("user", function(error, collection) {
		collection.findOne(criteria, function(user_error, user_doc) {
			callback(!error, user_doc);
		});
	});
}

function find_user_by_id(db, user_id, callback) {
	var id = new mongo.BSONPure.ObjectID(user_id);
	find_user(db, {_id: id}, callback);
}

function find_user_by_username(db, username, callback) {
	find_user(db, {username: username}, callback);
}

function search_users(db, query, callback) {
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

function find_wallposts(db, criteria, callback) {
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

function find_wallposts_to_user(db, user, callback) {
	find_wallposts(db, {to_id: user._id}, callback);
}

function add_wallpost(db, from_id, to_id, post, callback) {
	db.collection("wallpost", function(error, collection) {
		// Wallposts also contain the username of the sender
		// so we need to fetch that before inserting the wallpost.
		find_user_by_id(db, from_id, function(success, user) {
			if(!success) {
				callback(false, undefined);
				return;
			}

			to_id = new mongo.BSONPure.ObjectID(to_id);
			from_id = new mongo.BSONPure.ObjectID(from_id);
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
				callback(!post_error, wallpost_doc);
			});
		})
	})
}

function add_friend(db, user_id, friend_id, callback) {
	user_id = new mongo.BSONPure.ObjectID(user_id);
	friend_id = new mongo.BSONPure.ObjectID(friend_id);
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
