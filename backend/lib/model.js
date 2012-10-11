function register_user(db, user, callback) {
	db.collection("user", function(error, collection) {
		collection.insert(user, function(error, record) {
			callback(error, record);
		});
	});
}

function login(db, user, callback) {
    db.collection("user", function(error, collection) {
        collection.findOne({username: user.username}, function(error, dbUser) {
            if(dbUser == null)
                console.log("Username not found.");
            
            else if(user.password == dbUser.password)
                console.log("Logged in!");
            
            else
                console.log("Wrong password!");
            
            callback(error, dbUser);
        });
    });
}

exports.register_user = register_user;
exports.login = login;
