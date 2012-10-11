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

exports.register_user = register_user;
exports.username_exists = username_exists;
