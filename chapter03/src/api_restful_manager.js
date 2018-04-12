/*
	[api_restful_manager.js]

	encoding=utf-8
*/

const api_sql = require("./api_sql_tiny.js");






exports.api_v1_show = api_sql.api_v1_show;
exports.api_v1_sql = api_sql.api_v1_sql;


exports.api_v1_batterylog_add = api_sql.api_v1_batterylog_add;
exports.api_v1_batterylog_show = api_sql.api_v1_batterylog_show;
exports.api_v1_batterylog_delete = api_sql.api_v1_batterylog_delete;



