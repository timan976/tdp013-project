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
			console.log("logged out " + id);
			callback(error);
		});
    });
}

function find_user_by_id(db, user_id, callback) {
	db.collection("user", function(error, collection) {
		var id = new mongo.BSONPure.ObjectID(user_id);
		collection.findOne({_id: id}, function(user_error, user_doc) {
			callback(!error, user_doc);
		});
	});
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

exports.register_user = register_user;
exports.validate_login = validate_login;
exports.username_exists = username_exists;
exports.login_user = login_user;
exports.logout_user = logout_user;
exports.find_user_by_id = find_user_by_id;
exports.search_users = search_users;
