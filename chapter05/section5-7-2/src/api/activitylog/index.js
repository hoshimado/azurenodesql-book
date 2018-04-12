/**
 * [activitylog.js]
 * 
 * encoding=utf-8
 */


var _api_v1_base = require("./initialize.js");
exports.api_v1_activitylog_setup = _api_v1_base.api_v1_activitylog_setup;

var _user_manager = require("./user_manager.js");
exports.api_v1_activitylog_signup = _user_manager.api_v1_activitylog_signup;
exports.api_v1_activitylog_remove = _user_manager.api_v1_activitylog_remove;

var _api_method = require("./api_method.js");
exports.api_v1_activitylog_show = _api_method.api_v1_activitylog_show;
exports.api_v1_activitylog_add = _api_method.api_v1_activitylog_add;
exports.api_v1_activitylog_delete = _api_method.api_v1_activitylog_delete;
	




  