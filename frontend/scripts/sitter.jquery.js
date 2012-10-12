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
	});
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

function display_wallposts(user_id) {
	console.log("wall");
	$("#content").load_content("/content/wallposts", {
		viewer_id: sessionStorage["user_id"],
		user_id: user_id
	});
	return false;
}

function display_search() {
	$("#content").load_content("/content/search");
}

function load_startpage() {
	var user_id = sessionStorage["user_id"];
	if(user_id != undefined) {
		$("#page").load_content("/template/profile_page", {user_id: user_id}, function() {
			display_wallposts();
		});
	} else {
		$("#page").load_content("/template/index");
	}
	//window.history.pushState({}, "Your profile", "/profile_page");
}

$(document).ready(function() {

	window.onpopstate = function() {
		var pathname = window.location.pathname;
		if(pathname == '/') {
			load_startpage();
		}
	}

	$(document).on("click", ".main_nav a", function() {
		console.log("click");
		$("li.active").removeClass("active");
		$(this).parent().addClass("active");
		return false;
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
			}
		}, "json");

		return false;
	});

	$(document).on("click", "a#logout", function() {
		$.post("/logout", {user_id: sessionStorage.user_id}, function(response) {
			sessionStorage.clear();
			load_startpage();
		});
		return false;
	});

	$(document).on("click", "a#wallposts", function() { display_wallposts() });
	$(document).on("click", "a#search", function() { display_search() });

	$("#register_username").keyup(validate_username);
	$("#register_username").change(validate_username);
});

