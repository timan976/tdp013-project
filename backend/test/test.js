var should = require('should');
var request = require('superagent');
var assert = require('assert');

require('../lib-coverage/main.js');

var port = 8888;
var endpoint = "http://localhost:" + port;

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


    describe("POST register and login", function() {
        it("should return 200 OK", function(done) {
            request.post(endpoint + "/register?first_name=test&last_name=testsson&username=test&password=asd&password_repeat=asd&email=test@example.com").end(function(response) {
                request.post(endpoint + "/login?username=test&password=asd").end(function(response) {
                    
                    response.status.should.equal(200);
                    done();
                });
            });
        });
    });
    
    describe("POST /register with existing username", function() {
        it("should return 200 OK", function(done) {
            request.post(endpoint + "/register?first_name=test&last_name=testsson&username=test&password=asd&password_repeat=asd&email=test@example.com").end(function(response) {
                response.status.should.equal(200);
                done();
            });
        });
    });


    describe("POST /register with empty username", function() {
        it("should return 200 OK", function(done) {
            request.post(endpoint + "/register?first_name=test&last_name=testsson&username=testarn&password=asd&password_repeat=fel&email=test@example.com").end(function(response) {
                response.status.should.equal(200);
                done();
            });
        });
    });

    describe("POST /login", function() {
        it("should return 200 OK", function(done) {
            request.post(endpoint + "/login?username=test&password=asd").end(function(response) {
                response.status.should.equal(200);
                done();
            });
        });
    });


});


                
