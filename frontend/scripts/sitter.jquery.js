FLASH_ERROR = "error";
FLASH_SUCCESS = "success";
FLASH_NOTICE = "notice";

_flash_timeout_id = undefined;

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

validate_username_timeout = undefined;
function validate_username() {

	validate = function(username) {
		$.get('http://localhost:8888/valid_username', {username: username}, function(res) {
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

function display_wallposts(push_state, user_id) {
	console.log("display_wallposts");

	$("li.active").removeClass("active");
	$("a#wallposts").parent().addClass("active");

	$("#content").load_content("/content/wallposts", {
		viewer_id: sessionStorage["user_id"],
		user_id: user_id
	});

	if(push_state)
		window.history.pushState({page: '/'}, "Wallposts", "/");
}

function display_search(push_state) {
	console.log("Displaying search");
	$("li.active").removeClass("active");
	$("a#search").parent().addClass("active");

	$("#content").load_content("/content/search");

	if(push_state)
		window.history.pushState({page: '/search'}, "Search", "/search");
}

function load_startpage() {
	console.log("load_startpage()");

	var user_id = sessionStorage["user_id"];
	if(user_id != undefined) {
		$("#page").load_content("/template/profile_page", {user_id: user_id}, function() {
			display_wallposts();
		});
	} else {
		$("#page").load_content("/template/index");
	}
}

$(document).ready(function() {
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

		$.post("http://localhost:8888/login", credentials, function(response) {
			if(response.success) {
				// Create a session
				sessionStorage.username = username;
				sessionStorage.user_id = response.user_id;

				// Load profile page
				load_startpage();
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

	var page_map = {
		'/search': display_search,
		'/': display_wallposts
	};

	window.onpopstate = function(e) {
		var page = document.location.pathname;
		if(e.state)
			page = e.state.page;

		var user_id = sessionStorage["user_id"];
		$("#page").load_content("/template/profile_page", {user_id: user_id}, function() {
			var page_func = page_map[page];
			if(page_func != undefined) {
				page_func(false);
			}
		});
	}

	$(document).on("click", "a#logout", function() {
		$.post("/logout", {user_id: sessionStorage.user_id}, function(response) {
			sessionStorage.clear();
			load_startpage();
		});
		return false;
	});

	$(document).on("click", "a#wallposts", function() { display_wallposts(true); return false; });
	$(document).on("click", "a#search", function() { display_search(true); return false; });

	$(document).on("click", "a[href^='/user/']", function() {
		var url = "/content" + $(this).attr("href");
		$("#content").load_content(url);
		return false;
	});

	if(sessionStorage["user_id"] == undefined) {
		// Redirect to index
		console.log("not logged in");
		$("#page").load_content("/template/index");
		return;
	}

});

