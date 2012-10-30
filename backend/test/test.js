var should = require('should');
var request = require('superagent');
var assert = require('assert');
var io = require('socket.io-client');

require('../lib-coverage/main.js');

var port = 80;
var endpoint = "http://localhost:" + port;

// The logged in users id
var user_test_id;

// user id of user Boerworz
// We use this when testing wallposts and adding friends
var user_boerworz_id;

describe("Server", function() {
    describe("GET /", function() {
        it("should return 200 OK", function(done) {
            request(endpoint).end(function(response) {
                response.status.should.equal(200);
                done();
            });
        });
    });

    describe("GET /undefined", function() {
        it("should return status 404", function(done) {
            request(endpoint + "/undefined").end(function(response) {
                response.status.should.equal(404);
                done();
            });
        });
    });

    describe("POST /friends", function() {
        it("should return status 405", function(done) {
            request.post(endpoint + "/friends").end(function(response) {
                response.status.should.equal(405);
                done();
            });
        });
    });

	describe("Validate username", function() {
		it("should return 200 OK and {valid: true}", function(done) {
			request.get(endpoint + "/valid_username")
			.query({username: "test"})
			.end(function(response) {
				response.status.should.equal(200);
				response.body.valid.should.be.true;
				done();
			});
		});
	});

    describe("Register user", function() {
        it("should return 200 OK", function(done) {
			request.post(endpoint + "/register")
			.send("first_name=test")
			.send("last_name=testsson")
			.send("username=test")
			.send("password=asd")
			.send("password_repeat=asd")
			.send("email=test@example.com").end(function(response) {
                response.status.should.equal(200);
				response.body.success.should.be.true;
                done();
            });
        });
    });

	describe("Validate username after registering a user", function() {
		it("should return 200 OK and {valid: false}", function(done) {
			request.get(endpoint + "/valid_username")
			.query({username: "test"})
			.end(function(response) {
				response.status.should.equal(200);
				response.body.valid.should.be.false;
				done();
			});
		});
	});
    
	describe("Register with same username", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/register")
			.send("first_name=tester")
			.send("last_name=testsson")
			.send("username=test")
			.send("password=wed")
			.send("password_repeat=wed")
			.send("email=test2@example.com").end(function(response) {
				response.status.should.equal(200);
				response.body.success.should.be.false;
				done();
			});
		});
	});

	describe("Register with some emtpy fields", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/register")
			.send("first_name=")
			.send("last_name=testsson")
			.send("username=")
			.send("password=wed")
			.send("password_repeat=wed")
			.send("email=test2@example.com").end(function(response) {
				response.status.should.equal(200);
				response.body.success.should.be.false;
				done();
			});
		});
	});

	describe("Register with non-matching passwords", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/register")
			.send("first_name=test")
			.send("last_name=testsson")
			.send("username=test3")
			.send("password=hej")
			.send("password_repeat=nope")
			.send("email=test2@example.com").end(function(response) {
				response.status.should.equal(200);
				response.body.success.should.be.false;
				done();
			});
		});
	});

	describe("Register Boerworz", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/register")
			.send("first_name=Tim")
			.send("last_name=Andersson")
			.send("username=boerworz")
			.send("password=hej")
			.send("password_repeat=hej")
			.send("email=tim@example.com").end(function(response) {
				response.status.should.equal(200);
				response.body.success.should.be.true;
				done();
			});
		});
	});
	
	describe("Register Pelle", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/register")
			.send("first_name=Pelle")
			.send("last_name=Mattsson")
			.send("username=pelle")
			.send("password=hej")
			.send("password_repeat=hej")
			.send("email=pelle@example.com").end(function(response) {
				response.status.should.equal(200);
				response.body.success.should.be.true;
				done();
			});
		});
	});

    describe("Login test", function() {
        it("should return 200 OK", function(done) {
			request.post(endpoint + "/login")
			.send("username=test")
			.send("password=asd").end(function(response) {
                response.status.should.equal(200);
				response.body.success.should.be.true;
				response.body.user_id.should.exist;
				should.not.exist(response.body.error);
				user_test_id = response.body.user_id;
                done();
            });
        });
    });

	describe("Login Boerworz", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/login")
			.send("username=boerworz")
			.send("password=hej").end(function(response) {
				response.status.should.equal(200);
				response.body.success.should.be.true;
				response.body.user_id.should.exist;
				should.not.exist(response.body.error);
				user_boerworz_id = response.body.user_id;
				done();
			});
		});
	});

    describe("Login with wrong credentials", function() {
        it("should return 200 OK", function(done) {
			request.post(endpoint + "/login")
			.send("username=test")
			.send("password=hejwhsakdj").end(function(response) {
				response.status.should.equal(200);
				response.body.success.should.be.false;
				done();
			});
        });
    });

	describe("Get homepage with invalid user-id", function() {
		it("should return 500", function(done) {
			request.get(endpoint + "/template/home").end(function(response) {
				response.status.should.equal(500);
				done();
			});
		});
	});

	describe("Get homepage", function() {
		it("should return 200", function(done) {
			request.get(endpoint + "/template/home")
			.set('user-id', user_test_id)
			.end(function(response) {
				response.status.should.equal(200);
				done();
			});
		});
	});

	describe("Invalid search", function() {
		it("should return 400", function(done) {
			request.post(endpoint + "/search")
			.send("q=test").end(function(response) {
				response.status.should.equal(400);
				done();
			});
		});
	});

	describe("Search", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/search")
			.send("query=test").end(function(response) {
				response.status.should.equal(200);
				done();
			});
		});
	});

	describe("Wallpost from test to boerworz", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/save_wallpost")
			.set("user-id", user_test_id)
			.send("to_id=" + user_boerworz_id)
			.send("post=Hejsan").end(function(response) {
				response.status.should.equal(200);
				done();
			});
		});
	});

	describe("Empty wallpost from test to boerworz", function() {
		it("should return 400", function(done) {
			request.post(endpoint + "/save_wallpost")
			.set("user-id", user_test_id)
			.send("to_id=" + user_boerworz_id)
			.end(function(response) {
				response.status.should.equal(400);
				done();
			});
		});
	});

	describe("Add boerworz as a friend to test", function() {
		it("should return 200 and {success: true}", function(done) {
			request.post(endpoint + "/add_friend")
			.set("user-id", user_test_id)
			.send("friend_id=" + user_boerworz_id)
			.end(function(response) {
				response.status.should.equal(200);
				response.body.success.should.be.true;
				done();
			});
		});
	});

	describe("/add_friend with invalid friend_id", function() {
		it("should return 400", function(done) {
			request.post(endpoint + "/add_friend")
			.set("user-id", user_test_id)
			.send("friend_id=123")
			.end(function(response) {
				response.status.should.equal(400);
				done();
			});
		});
	});

	describe("/add_friend with invalid user-id", function() {
		it("should return 400", function(done) {
			request.post(endpoint + "/add_friend")
			.set("user-id", "123")
			.send("friend_id=" + user_boerworz_id)
			.end(function(response) {
				response.status.should.equal(400);
				done();
			});
		});
	});

	describe("Logout", function() {
		it("should return 200 OK", function(done) {
			request.post(endpoint + "/logout").end(function(response) {
				response.status.should.equal(200);
				done();
			});
		});
	});
});
