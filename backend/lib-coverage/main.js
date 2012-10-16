/* automatically generated by JSCoverage - do not edit */
try {
  if (typeof top === 'object' && top !== null && typeof top.opener === 'object' && top.opener !== null) {
    // this is a browser window that was opened from another window

    if (! top.opener._$jscoverage) {
      top.opener._$jscoverage = {};
    }
  }
}
catch (e) {}

try {
  if (typeof top === 'object' && top !== null) {
    // this is a browser window

    try {
      if (typeof top.opener === 'object' && top.opener !== null && top.opener._$jscoverage) {
        top._$jscoverage = top.opener._$jscoverage;
      }
    }
    catch (e) {}

    if (! top._$jscoverage) {
      top._$jscoverage = {};
    }
  }
}
catch (e) {}

try {
  if (typeof top === 'object' && top !== null && top._$jscoverage) {
    _$jscoverage = top._$jscoverage;
  }
}
catch (e) {}
if (typeof _$jscoverage !== 'object') {
  _$jscoverage = {};
}
if (! _$jscoverage['main.js']) {
  _$jscoverage['main.js'] = [];
  _$jscoverage['main.js'][1] = 0;
  _$jscoverage['main.js'][2] = 0;
  _$jscoverage['main.js'][3] = 0;
  _$jscoverage['main.js'][4] = 0;
  _$jscoverage['main.js'][6] = 0;
  _$jscoverage['main.js'][81] = 0;
}
_$jscoverage['main.js'].source = ["var server = require('./server');","var router = require('./router');","var requestHandlers = require('./requestHandlers');","var static_handler = require('./static_handler');","","var handlers = {","\t'/static/**': {","\t\t'GET': static_handler.serve_static,","\t},","","\t'/': {","\t\t'GET': requestHandlers.base,","\t},","","\t'/template/index': {","\t\t'GET': requestHandlers.index,","\t},","","\t'/register': {","\t\t'POST': requestHandlers.register,","\t},","","   \t'/login': {","\t\t'POST': requestHandlers.login,","\t},","","   \t'/logout': {","\t\t'POST': requestHandlers.logout,","\t},","","\t'/valid_username': {","\t\t'GET': requestHandlers.valid_username,","\t},","","\t'/template/home': {","\t\t'GET': requestHandlers.homepage,","\t},","","\t'/content/wall': {","\t\t'GET': requestHandlers.wall,","\t},","","\t'/content/search': {","\t\t'GET': requestHandlers.search_form,","\t},","","\t'/search': {","\t\t'GET': requestHandlers.base,","\t\t'POST': requestHandlers.search,","\t},","","\t'/content/user/*': {","\t\t'GET': requestHandlers.show_user,","\t},","","\t'/user/*': {","\t\t'GET': requestHandlers.base","\t},","","\t'/content/wallposts': {","\t\t'GET': requestHandlers.wallposts","\t},","","\t'/save_wallpost': {","\t\t'POST': requestHandlers.save_wallpost","\t},","","\t'/add_friend': {","\t\t'POST': requestHandlers.add_friend","\t},","","\t'/friends': {","\t\t'GET': requestHandlers.base","\t},","","\t'/content/friends': {","\t\t'GET': requestHandlers.friends","\t}","};","","server.start(router.route, handlers);"];
_$jscoverage['main.js'][1]++;
var server = require("./server");
_$jscoverage['main.js'][2]++;
var router = require("./router");
_$jscoverage['main.js'][3]++;
var requestHandlers = require("./requestHandlers");
_$jscoverage['main.js'][4]++;
var static_handler = require("./static_handler");
_$jscoverage['main.js'][6]++;
var handlers = {"/static/**": {"GET": static_handler.serve_static}, "/": {"GET": requestHandlers.base}, "/template/index": {"GET": requestHandlers.index}, "/register": {"POST": requestHandlers.register}, "/login": {"POST": requestHandlers.login}, "/logout": {"POST": requestHandlers.logout}, "/valid_username": {"GET": requestHandlers.valid_username}, "/template/home": {"GET": requestHandlers.homepage}, "/content/wall": {"GET": requestHandlers.wall}, "/content/search": {"GET": requestHandlers.search_form}, "/search": {"GET": requestHandlers.base, "POST": requestHandlers.search}, "/content/user/*": {"GET": requestHandlers.show_user}, "/user/*": {"GET": requestHandlers.base}, "/content/wallposts": {"GET": requestHandlers.wallposts}, "/save_wallpost": {"POST": requestHandlers.save_wallpost}, "/add_friend": {"POST": requestHandlers.add_friend}, "/friends": {"GET": requestHandlers.base}, "/content/friends": {"GET": requestHandlers.friends}};
_$jscoverage['main.js'][81]++;
server.start(router.route, handlers);
