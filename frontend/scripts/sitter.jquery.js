// Pardon the global object
socket = undefined;

// Add some functions to the jQuery objects
jQuery.fn.load_content = function() {
	// GETs some (HTML) content and adds it to the element
	
	if(arguments.length == 0) return;

	var element = $(this[0]);
	var resource = arguments[0];
	var data = arguments[1] || {};
	var callback = arguments[2] || function() {};
	
	$.get(resource, data, function(response) {
		element.html(response);
		callback();
	}, "html");
}

function match(handlers, request_path) {
	for(var route_path in handlers) {
		if(route_path.indexOf('*') != -1) {
			var regex_string = route_path.replace("**", "(([0-9a-zA-Z._-]+/?)+)").replace(/\*/g, "([0-9a-zA-Z._-]+)");
			var regex = new RegExp(regex_string, "i");
			var matches = request_path.match(regex);

			if(!matches)
				continue;

			if(matches[0] == request_path) {
				var params = [];
				if(matches.length > 2)
					params = matches.slice(1, matches.length - 1);
				else
					params = [matches[1]];
				return {
					handler: handlers[route_path],
					params: params
				};
			}
		} else {
			if(route_path == request_path) {
				return {
					handler: handlers[route_path],
					params: []
				};
			}
		}
	}
	return false;
}

validate_username_timeout = undefined;
function validate_username() {

	validate = function(username) {
		$.get('/valid_username', {username: username}, function(res) {
			if(!res.valid) {
				$("#register_control_group").addClass("error");
				$("form#register input[type='submit']").attr("disabled", "disabled");
				$("#username_icon").addClass("icon-minus-sign");
				$("#username_icon").removeClass("icon-ok-sign");
			} else {
				$("#register_control_group").removeClass("error");
				$("form#register input[type='submit']").removeAttr("disabled");
				$("#username_icon").removeClass("icon-minus-sign");
				$("#username_icon").addClass("icon-ok-sign");
			}
		}, "json");
	}

	// We wait 0.15 seconds to see if the user continues
	// to type more characters before we validate the username
	if(validate_username_timeout)
		clearTimeout(validate_username_timeout);
	var elm = $(this);
	validate_username_timeout = setTimeout(function() { validate(elm.val()) }, 150);
}

// Pages
function display_wall(push_state) {
	// The logged in users wall
	
	$("li.active").removeClass("active");
	$("a[href='/']").parent().addClass("active");

	$.ajax('/content/wall', {
		headers: {"user-id": sessionStorage["user_id"]},
		dataType: 'html'
	}).done(function(response) {
		$("#content").html(response);
		poll_wallposts(sessionStorage.user_id);
	});

	if(push_state)
		window.history.pushState({page: '/'}, "Wallposts", "/");
}

function display_search(push_state) {
	// Search page
	
	$("li.active").removeClass("active");
	$("a[href='/search']").parent().addClass("active");

	$("#content").load_content("/content/search");

	if(push_state)
		window.history.pushState({page: '/search'}, "Search", "/search");
}

function display_user_page(username, push_state) {
	// A users page
	
	$("li.active").removeClass("active");

	var url = '/content/user/' + username;
	$.ajax(url, {
		headers: {'user-id': sessionStorage.user_id},
		dataType: 'json'
	}).done(function(response) {
		$("#content").html(response.content);
		poll_wallposts(response.user_id, sessionStorage.user_id);
	});

	if(push_state)
		window.history.pushState({page: '/user/' + username}, "User page", '/user/' + username);
}

function display_friends(push_state) {
	$("li.active").removeClass("active");
	$("a[href='/friends']").parent().addClass("active");

	$.ajax('/content/friends', {
		headers: {'user-id': sessionStorage.user_id},
		dataType: 'html'
	}).done(function(response) {
		$("#content").html(response);
	});

	if(push_state)
		window.history.pushState({page: '/friends'}, "Friends", '/friends');
}

function display_chat(chat_id, push_state) {
	$("li.active").removeClass("active");
	$("a[href='/messages']").parent().addClass("active");
	
	if(socket) {
		socket.emit("rejoin", {
			chat_id: chat_id
		});
	}

	var url = '/content/chat/' + chat_id;
	$.ajax(url, {
		headers: {'user-id': sessionStorage.user_id},
		dataType: 'html'
	}).done(function(response) {
		$("#content").html(response);
	});

	if(push_state)
		window.history.pushState({page: '/chat/' + chat_id}, "Messages", '/chat/' + chat_id);
}

// Loads the base template, which depends on if the
// user is logged in or not.
function load_base(callback) {
	var user_id = sessionStorage["user_id"];
	if(user_id != undefined) {
		$.ajax("/template/home", {
			headers: {"user-id": user_id},
			dataType: "html"
		}).done(function(response) {
			$("#page").html(response);
			if(callback != undefined)
				callback();
		});
	} else {
		$("#page").load_content("/template/index");
	}
}

// Loads the correct content for the path.
// load_base needs to be called once before 
// this function is called.
var page_map = {
	'/user/*': display_user_page,
	'/chat/*': display_chat,
	'/search': display_search,
	'/friends': display_friends,
	'/': display_wall
};

function load_content(page) {
	var user_id = sessionStorage["user_id"];
	var m = match(page_map, page);
	if(!m) return;

	var page_func = m.handler;
	var params = m.params;
	params.push(false);
	if(page_func != undefined)
		page_func.apply(this, params);
}

var worker;
function poll_wallposts(user_id, ignore_user_id) {
	if(worker)
		worker.terminate();

	worker = new Worker("/static/scripts/wallposts.worker.js");
	worker.addEventListener("message", function(e) {
		if(e.data.message == "new") {
			// New wallposts have been posted since we
			// opened the page
			$("#wallposts").append(e.data.content);
		}
	});

	worker.postMessage({
		message: "start",
		user_id: user_id,
		ignore_user_id: ignore_user_id,
		last_updated: new Date()
	});
}

function create_socket() {
	socket = io.connect("http://localhost");
	socket.emit("init", {user_id: sessionStorage.user_id});

	socket.on("created", function(chat_id) {
		// Load the page for the new chat
		display_chat(chat_id, true);
	});

	socket.on("added", function(chat_id) {
		// The user was added to a chat
		$("#flash > .message").html("You were added to a <a href='/chat/" + chat_id + "'>chat</a>!");
		$("#flash").show();
	});

	socket.on("message", function(data) {
		var count = $("#messages > .chat_message").size();
		if(count == 0)
			$("#messages").html("");
		$("#messages").append(data.content + "<br />");
	});
}

$(document).ready(function() {
	load_base();

	$(document).on("keyup", "#register_username", validate_username);
	$(document).on("change", "#register_username", validate_username);

	$(document).on("click", "#login_error > .close", function() {
		$("#login_error").hide();
	});

	$(document).on("submit", "#login", function() {
		var username = $("#username").val();
		var credentials = {	
			username: username,
			password: $("#password").val()
		};                 	
                           	
		$.post("/login", credentials, function(response) {
			if(response.success) {
				// Create a session
				sessionStorage.username = username;
				sessionStorage.user_id = response.user_id;

				// Load profile page
				load_base(function() {
					load_content("/");
					create_socket();
				});
			} else {
				$("#login_error").show();
			}
		}, "json");

		return false;
	});

	$(document).on("submit", "#search_form", function() {
		var query = $("input[name=query]").val();
		var data = {query: query};
		$.post("/search", data, function(response) {
			$("#search_results").html(response);
		}, "html");
		return false;
	});

	window.onpopstate = function(e) {
		if(sessionStorage["user_id"] == undefined) 
			return;
		
		var page = window.location.pathname;
		if(e.state != undefined)
			page = e.state.page;

		load_content(page);
	}

	$(document).on("click", "a[href='/']", function() { display_wall(true); return false; });
	$(document).on("click", "a[href='/search']", function() { display_search(true); return false; });
	$(document).on("click", "a[href='/friends']", function() { display_friends(true); return false; });
	$(document).on("click", "a[href^='/user/']", function() {
		var username = $(this).attr("href").substring(6);
		display_user_page(username, true);
		return false;
	});

	$(document).on("click", "a#logout", function() {
		$.post("/logout", {user_id: sessionStorage.user_id}, function(response) {
			sessionStorage.clear();
			load_base();
		});
		return false;
	});

	$(document).on("click", "#friend_button", function() {
		var data = {friend_id: $(this).attr("data-friend-id")};
		$.ajax('/add_friend', {
			headers: {'user-id': sessionStorage.user_id},
			type: 'POST',
			data: data,
			dataType: 'json'
		}).done(function(response) {
			if(response.success)
				$("#friend_button").hide();
		});
		return false;
	});

	$(document).on("click", "#start_chat", function() {
		var data = {
			user_id: sessionStorage.user_id,
			partner_id: $(this).attr("data-partner-id")
		};
		socket.emit("create", data);
	});

	// Wallpost form
	$(document).on("submit", "#wallpost_form", function() {
		var post = $("textarea[name='post']").val().trim();
		if(post.length == 0)
			return false;

		var data = {
			to_id: $("input[name='to_id']").val(),
			post: post
		};

		$.ajax('/save_wallpost', {
			headers: {'user-id': sessionStorage.user_id},
			dataType: 'html',
			data: data,
			type: 'POST'
		}).done(function(response) {
			$("#wallposts > #notice").hide();
			$("#wallposts").append(response);
		});

		return false;
	});

	$(document).on("submit", "#chat_form", function() {
		// Post a chat message
		var message = $("#chat_form input[name='message']").val().trim();
		if(message.length == 0) 
			return false;
		var chat_id = $("#chat_form input[name='chat_id']").val();
		var user_id = sessionStorage.user_id;

		if(!socket)
			return false;

		socket.emit("message", {
			message: message,
			chat_id: chat_id,
			user_id: user_id
		});

		$("#chat_form input[name='message']").val("");

		return false;
	});

	$(document).on("click", "a[href^='/chat/']", function() {
		var chat_id = $(this).attr("href").substring(6);
		display_chat(chat_id, true);
		$("#flash").hide();
		return false;
	});

	$(document).on("click", "#flash .close", function() {
		$("#flash").hide();
	});

	$(document).on("click", "#add_to_chat_form button", function() {
		var option_element = $("#add_to_chat_form").find("option:selected");
		var user_id = option_element.attr("data-user-id");
		var chat_id = $("#add_to_chat_form select").attr("data-chat-id");
		var username = option_element.attr("data-username");

		if(!socket)
			return;

		socket.emit("add", {
			user_id: user_id,
			chat_id: chat_id
		});

		var link = '<a href="/user/' + username + '">' + option_element.val(); + '</a>';
		$(".member_list").append(", " + link);

		option_element.remove();
		if($("#add_to_chat_form option").size() == 0)
			$(".add_user").remove();

		return false;
	});

	if(sessionStorage["user_id"] == undefined) {
		// Show homepage
		$("#page").load_content("/template/index");
		window.history.pushState(null, "bookster", "/");
		return;
	}

	// Chat
	create_socket();
});

