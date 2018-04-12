/**
 * [index.js] for sql_db_io.
 * 
 *  encoding=utf-8
 */


var _shaping = require("./shaping_param4db.js");
exports.getShowObjectFromGetData = _shaping.getShowObjectFromGetData;
exports.getDeleteObjectFromPostData = _shaping.getDeleteObjectFromPostData;
exports.getInsertObjectFromPostData = _shaping.getInsertObjectFromPostData;



var _crud = require("./sql_lite_db_crud.js");
exports.createPromiseForSqlConnection = _crud.createPromiseForSqlConnection;
exports.closeConnection = _crud.closeConnection;

exports.setupTable1st = _crud.setupTable1st;

exports.addNewUser = _crud.addNewUser;
exports.getNumberOfUsers = _crud.getNumberOfUsers;
exports.deleteExistUser = _crud.deleteExistUser;
exports.isOwnerValid = _crud.isOwnerValid;

exports.getNumberOfLogs = _crud.getNumberOfLogs;
exports.addActivityLog2Database = _crud.addActivityLog2Database;
exports.getListOfActivityLogWhereDeviceKey = _crud.getListOfActivityLogWhereDeviceKey;
exports.deleteActivityLogWhereDeviceKey = _crud.deleteActivityLogWhereDeviceKey;



