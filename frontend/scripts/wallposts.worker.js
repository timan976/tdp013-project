function poll_wallposts(user_id, ignore_user_id, last_updated, callback) {
	// Check for new wallposts
	var request = new XMLHttpRequest();

	// Open a synchronous AJAX-request
	var query_string = "?user_id=" + user_id;
	if(ignore_user_id != undefined)
		query_string += "&ignore=" + ignore_user_id;
	var url = '/content/wallposts' + query_string;
	request.open('GET', url, false);
	request.setRequestHeader('If-Modified-Since', last_updated.toString());
	request.send();

	// Handle response
	if(request.responseText.length == 0) {
		setTimeout(function() {
			poll_wallposts(user_id, ignore_user_id, last_updated, callback);
		}, 1000);
		return;
	}

	var response = JSON.parse(request.responseText);
	callback(response.content);

	var new_date = response.last_updated;
	setTimeout(function() {
		poll_wallposts(user_id, ignore_user_id, new_date, callback);
	}, 1000);
}

addEventListener("message", function(e) {
	var data = e.data;
	if(data.message == "start") {
		var user_id = data.user_id;
		var ignore_user_id = data.ignore_user_id;
		var last_updated = data.last_updated;
		poll_wallposts(user_id, ignore_user_id, last_updated, function(content) {
			postMessage({message: "new", content: content});
		});
	}
}, false);
