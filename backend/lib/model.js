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
			callback(dbUser != null && user.password == dbUser.password);
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

exports.register_user = register_user;
exports.validate_login = validate_login;
exports.username_exists = username_exists;
exports.login_user = login_user;
