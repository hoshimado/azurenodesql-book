/**
 * [api_param.js]
 * 
 * encoding=utf-8
 */


 var console_output = require("../debugger.js").console_output;


 /**
 * Promiseで受けわたす、APIの引数チェックしたい！
 * device_key, type_value, date_start, date_end, max_count
 */
var API_PARAM = function(init){
	this.device_key = init.device_key;
	this.pass_key = init.pass_key;
	this.type_value = init.type_value;
	this.date_start = init.date_start;
	this.date_end   = init.date_end;
	this.max_count = init.max_count;
};
var isDefined = function( self, prop ){
	if( !self[prop] ){
		// ここは、正常系では呼ばれないハズなので「console.log()」を直接呼ぶ。
		console_output( "[API_PARAM]::" + prop + " is NOT defind" );
	}
	return self[prop];
};
API_PARAM.prototype.getDeviceKey = function(){ return isDefined( this, "device_key"); };
API_PARAM.prototype.getPassKey = function(){ return isDefined( this, "pass_key"); };
API_PARAM.prototype.getTypeValue = function(){ return isDefined( this, "type_value"); };
API_PARAM.prototype.getStartDate = function(){ return isDefined( this, "date_start"); };
API_PARAM.prototype.getEndDate   = function(){ return isDefined( this, "date_end"); };

API_PARAM.prototype.getMaxCount = function(){ return isDefined( this, "max_count"); };
API_PARAM.prototype.setMaxCount = function( maxCount ){ this.max_count = maxCount; };
exports.API_PARAM = API_PARAM;

