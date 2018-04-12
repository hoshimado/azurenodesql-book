/**
 * [api_v1_base.js]
 * 
 * encoding=utf-8
 */

var API_PARAM = require("./api_param.js").API_PARAM;



/**
 * 基本となるSQLのシークエンス。クラス（というか、プロトタイプ）。
 */
var API_V1_BASE = function( configSql, sqlParts, outJsonBuffer ){
	this._config_sql = configSql;
	this._sql_parts = sqlParts;
	this._outJsonData = outJsonBuffer ? outJsonBuffer : {};
};
API_V1_BASE.prototype.isOwnerValid = function( inputData ){
	// 接続元の認証Y/Nを検証。
	var instance = this;
	var outJsonData = instance._outJsonData;
	var paramClass = new API_PARAM( inputData );

	return new Promise(function(resolve,reject){ // アロー演算子で統一してもいいんだけどね⇒this問題の回避は。
		var config = instance._config_sql.getInstance();
		var isOwnerValid = instance._sql_parts.getInstance( "isOwnerValid" );
		var is_onwer_valid_promise = isOwnerValid( 
			config.database, 
			paramClass.getDeviceKey(), 
			paramClass.getPassKey()
		);
		is_onwer_valid_promise.then(function( maxCount ){
			paramClass.setMaxCount( maxCount );
			resolve( paramClass ); // ⇒次のthen()が呼ばれる。
		}).catch(function(err){
			if( err ){
				outJsonData[ "errer_on_validation" ] = err;
			}
			reject({
				"http_status" : 401 // Unauthorized
			}); // ⇒次のcatch()が呼ばれる。
		});
	});	
};
API_V1_BASE.prototype.isAccessRateValied = function(){};
/**
 * サブクラスでオーバーライドする。
 */
API_V1_BASE.prototype.requestSql = function( paramClass ){
	return Promise.resolve();
	// paramClass =>
	// API_PARAM.prototype.getDeviceKey = function(){ return isDefined( this, "device_key"); };
	// API_PARAM.prototype.getTypeValue = function(){ return isDefined( this, "type_value"); };
	// API_PARAM.prototype.getStartDate = function(){ return isDefined( this, "date_start"); };
	// API_PARAM.prototype.getEndDate   = function(){ return isDefined( this, "date_end"); };
	// API_PARAM.prototype.getMaxCount = function(){ return isDefined( this, "max_count"); };
};
API_V1_BASE.prototype.closeNormal = function(){
	var instance = this;
	var outJsonData = instance._outJsonData;

	return new Promise((resolve,reject)=>{
		var config = instance._config_sql.getInstance();
		var closeConnection = instance._sql_parts.getInstance().closeConnection;
		closeConnection( config.database ).then(()=>{
			resolve({
				"jsonData" : outJsonData,
				"status" : 200 // OK 【FixMe】直前までの内容に応じて変更する。
			});
		});
	});
};
/**
 * @param{Object} err プロパティ{"http_status" : HTTPエラーコード}があれば、ソレをHTTP応答のステータスとする。
 */
API_V1_BASE.prototype.closeAnomaly = function( err ){
	var instance = this;
	var outJsonData = instance._outJsonData;

	return new Promise((resolve,reject)=>{
		var config = instance._config_sql.getInstance();
		var closeConnection = instance._sql_parts.getInstance().closeConnection;
		var http_status = (err && err.http_status) ? err.http_status : 500;

		closeConnection( config.database ).then(()=>{
			resolve({
			"jsonData" : outJsonData,
			"status" : http_status
			}); // 異常系処理を終えたので、戻すのは「正常」。
		});
	});
};
API_V1_BASE.prototype.run = function( inputData ){ // getほげほげObjectFromGetData( queryFromGet );済みを渡す。
	var instance = this;
	var outJsonData = instance._outJsonData;

	if( inputData.invalid && inputData.invalid.length > 0 ){
		outJsonData[ "error_on_format" ] = "GET or POST format is INVAILD.";
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : 400 // Bad Request
		});
	}

	return new Promise(function(resolve,reject){
		var createPromiseForSqlConnection = instance._sql_parts.getInstance().createPromiseForSqlConnection;
		
		createPromiseForSqlConnection(
			instance._config_sql.getInstance()
		).then(function(){
			outJsonData["result"] = "sql connection is OK!";
			resolve();
		}).catch(function(err){
			outJsonData[ "errer_on_connection" ] = err;
			reject({
				"http_status" : 401 // Unauthorized
			}); // ⇒次のcatch()が呼ばれる。)			
		});
	}).then(function(){
		return instance.isOwnerValid( inputData ); // ここは、冒頭の引数そのまま渡す。
	}).then(function( paramClass ){
		// ToDo：アクセス頻度のガードを入れる。
		return Promise.resolve( paramClass );
	}).then( ( paramClass )=>{
		return instance.requestSql( paramClass );
	}).then(function(){
		// ここまですべて正常終了
		return instance.closeNormal();
	}).catch(function(err){
        // どこかでエラーした⇒エラー応答のjson返す。
		return instance.closeAnomaly( err );
	});
};
exports.API_V1_BASE = API_V1_BASE;


