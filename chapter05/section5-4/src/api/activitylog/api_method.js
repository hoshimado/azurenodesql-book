/**
 * [api_method.js]
 * 
 * encoding=utf-8
 */

var API_PARAM = require("./api_param.js").API_PARAM;
var API_V1_BASE = require("./api_v1_base.js").API_V1_BASE;

var lib = require("../factory4require.js");
var factoryImpl = { // require()を使う代わりに、new Factory() する。
    "sql_parts" : new lib.Factory4Require("./sql_db_io/index.js"),
};
var _SQL_CONNECTION_CONFIG = require("../sql_config.js");
factoryImpl[ "CONFIG_SQL" ] = new lib.Factory(_SQL_CONNECTION_CONFIG.CONFIG_SQL);
factoryImpl[ "MAX_USERS"] = new lib.Factory( _SQL_CONNECTION_CONFIG.MAX_USERS );
factoryImpl[ "MAX_LOGS" ] = new lib.Factory( _SQL_CONNECTION_CONFIG.MAX_LOGS );


// UTデバッグ用のHookポイント。運用では外部公開しないメソッドはこっちにまとめる。
exports.factoryImpl = factoryImpl;



/**
 * バッテリーログをSQLから、指定されたデバイス（のハッシュ値）のものを取得する。
 */
exports.api_v1_activitylog_show = function( queryFromGet, dataFromPost ){
	var API_SHOW = function(){
		// サブクラスのコンスタラクタ
		this._outJsonData = {};
		API_V1_BASE.call( this, factoryImpl.CONFIG_SQL, factoryImpl.sql_parts, this._outJsonData ); // 継承元のコンスタラクタを明示的に呼び出す。
	};
	API_SHOW.prototype = Object.create( API_V1_BASE.prototype );
	API_SHOW.prototype.requestSql = function( paramClass ){
		// 対象のログデータをSQLへ要求
		var outJsonData = this._outJsonData;
		var config = factoryImpl.CONFIG_SQL.getInstance();
	    var getListOfActivityLogWhereDeviceKey = factoryImpl.sql_parts.getInstance().getListOfActivityLogWhereDeviceKey;

		return new Promise(function(resolve,reject){
			getListOfActivityLogWhereDeviceKey(
				config.database, 
				paramClass.getDeviceKey(), 
				{ 
					"start" : paramClass.getStartDate(), 
					"end"   : paramClass.getEndDate()
				}
			).then(function(recordset){
		        // ログ取得処理が成功
				// 【FixME】総登録数（対象のデバイスについて）を取得してjsonに含めて返す。取れなければ null でOK（その場合も成功扱い）。
				outJsonData["table"] = recordset;
				resolve();
			}).catch(function(err){
				// 取得処理で失敗。
				outJsonData[ "error_on_insert" ];
				reject( err ); // ⇒次のcatch()が呼ばれる。
			});
		});
	};
	var subInstance = new API_SHOW();
	var getShowObjectFromGetData = factoryImpl.sql_parts.getInstance().getShowObjectFromGetData;
	var inputData = getShowObjectFromGetData( queryFromGet );
	return subInstance.run( inputData );
};


/**
 * バッテリーログをSQLへ記録するAPI
 */
exports.api_v1_activitylog_add = function( queryFromGet, dataFromPost ){
	var API_ADD = function(){
		this._outJsonData = {};
		API_V1_BASE.call( this, factoryImpl.CONFIG_SQL, factoryImpl.sql_parts, this._outJsonData ); // 継承元のコンスタラクタを明示的に呼び出す。
	};
	API_ADD.prototype = Object.create( API_V1_BASE.prototype );
	API_ADD.prototype.requestSql = function( paramClass ){

		var outJsonData = this._outJsonData;
		var config = factoryImpl.CONFIG_SQL.getInstance();

		return new Promise(function(resolve,reject){
			var getNumberOfLogs = factoryImpl.sql_parts.getInstance().getNumberOfLogs;

			// 先ず、データ数をチェックする。
			getNumberOfLogs( config.database, paramClass.getDeviceKey() )
			.then( function(numberOfLogs){
				if( numberOfLogs < paramClass.getMaxCount() ){
					resolve( paramClass );
				}else{
					outJsonData["failed"] = {
						"message" : "There are too many Logs per account."
					};
					reject({
						"http_status" : 429
					});
				}
			}).catch( function(err){
				reject( err );
			});
		}).then(function( paramClass2 ){
			var addActivityLog2Database = factoryImpl.sql_parts.getInstance().addActivityLog2Database;

			// 対象のログデータをSQLへ追加
			addActivityLog2Database(
				config.database, 
				paramClass2.getDeviceKey(), 
				paramClass2.getTypeValue() 
			).then(function(resultInsert){
				// 「インサート」処理が成功
				// 【FixME】総登録数（対象のデバイスについて）を取得してjsonに含めて返す。取れなければ null でOK（その場合も成功扱い）。
				var param = new API_PARAM(resultInsert);
				outJsonData[ "result" ] = "Success to insert " + param.getTypeValue() + " as activitylog on Database!";
				outJsonData[ "device_key"] = param.getDeviceKey();
				return Promise.resolve();
			}).catch(function(err){
				// 「インサート」処理で失敗。
				outJsonData[ "error_on_insert" ];
				return Promise.reject( err ); // ⇒次のcatch()が呼ばれる。
			});
		});
	};
	var subInstance = new API_ADD();
	var getInsertObjectFromPostData = factoryImpl.sql_parts.getInstance().getInsertObjectFromPostData;
	var inputData = getInsertObjectFromPostData( dataFromPost );
	return subInstance.run( inputData );
};



/**
 * バッテリーログをSQLから削除API
 */
exports.api_v1_activitylog_delete = function( queryFromGet, dataFromPost ){
	var API_DEL = function(){
		this._outJsonData = {};
		API_V1_BASE.call( this, factoryImpl.CONFIG_SQL, factoryImpl.sql_parts, this._outJsonData ); // 継承元のコンスタラクタを明示的に呼び出す。
	};
	API_DEL.prototype = Object.create( API_V1_BASE.prototype );
	API_DEL.prototype.requestSql = function( paramClass ){
		
		// 対象のログデータをSQLへ要求
		var outJsonData = this._outJsonData;
		var config = factoryImpl.CONFIG_SQL.getInstance();
		var deleteActivityLogWhereDeviceKey = factoryImpl.sql_parts.getInstance().deleteActivityLogWhereDeviceKey;
		var period = {};
		if( paramClass.getStartDate() ){
			period["start"] = paramClass.getStartDate();
		}
		if( paramClass.getEndDate() ){
			period["end"] = paramClass.getEndDate();
		}

		return new Promise(function(resolve,reject){
			deleteActivityLogWhereDeviceKey(
				config.database, 
				paramClass.getDeviceKey(), 
				period
			).then(function(){
				// 「削除」処理が成功
				var getNumberOfLogs = factoryImpl.sql_parts.getInstance().getNumberOfLogs;
				return getNumberOfLogs( 
					config.database,
					paramClass.getDeviceKey()
				).then(function(numberOfLogs){
					outJsonData["number_of_logs"] = numberOfLogs;
					outJsonData["device_key"] = paramClass.getDeviceKey();
					resolve();
				});
			}).catch(function(err){
				// 「削除」or「残ログ数取得」処理で失敗。
				outJsonData[ "error_on_delete" ];
				reject( err ); // ⇒次のcatch()が呼ばれる。
			});
		});
	};
	var subInstance = new API_DEL();
	var getDeleteObjectFromPostData = factoryImpl.sql_parts.getInstance().getDeleteObjectFromPostData;
	var inputData = getDeleteObjectFromPostData( dataFromPost );
	return subInstance.run( inputData );
};









  