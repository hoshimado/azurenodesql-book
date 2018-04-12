/*
    [api_sql_tiny.js]
    
	encoding=utf-8
*/

var debug = require("./debugger.js");
require('date-utils'); // Data() クラスのtoString()を拡張してくれる。

var lib = require("./factory4require.js");
var factoryImpl = { // require()を使う代わりに、new Factory() する。
    "mssql" : new lib.Factory4Require("mssql"),  // https://www.npmjs.com/package/mssql
    "sql_parts" : new lib.Factory4Require("./sql_parts.js")
};

// UTデバッグ用のHookポイント。運用では外部公開しないメソッドはこっちにまとめる。
exports.factoryImpl = factoryImpl;




/**
 * 情報表示API：　バージョン表示など
 */
exports.api_v1_show = function( queryFromGet, dataFromPost ){
console.log( queryFromGet );
	var name = queryFromGet[ "name" ];
	if( name == "version" ){
		return Promise.resolve({
			"jsonData" : { "version" : "1.00" },
			"status" : 200 // OK 【FixMe】直前までの無いように応じて変更する。
		});
	} else {
		return Promise.resolve({
			"jsonData" : { result : "show api is here." },
			"status" : 200 // OK 【FixMe】直前までの無いように応じて変更する。
		});
	}
};



/**
 * @type SQL Server接続用の設定変数。
 * 詳細は⇒ https://www.npmjs.com/package/mssql
 */
var CONFIG_SQL = {
	user : process.env.SQL_USER,
	password : process.env.SQL_PASSWORD,
	server : process.env.SQL_SERVER, // You can use 'localhost\\instance' to connect to named instance
	database : process.env.SQL_DATABASE,
	stream : false,  // if true, query.promise() is NOT work! // You can enable streaming globally

	// Use this if you're on Windows Azure
	options : {
		encrypt : true 
	} // It works well on LOCAL SQL Server if this option is set.
};
factoryImpl[ "CONFIG_SQL" ] = new lib.Factory( CONFIG_SQL );
// 即時関数でCONFIG_SQLを隠蔽してもいいんだけど、、、面倒なのでパス。



/**
 * @type アクセス回数など
 */
var RATE_LIMIT = {
	TIMES_PER_HOUR : 30
};
factoryImpl[ "RATE_LIMIT" ] = new lib.Factory( RATE_LIMIT );





/**
 * Promiseで受けわたす、APIの引数チェックしたい！
 * device_key, battery_value, date_start, date_end, max_count
 */
var API_PARAM = function(init){
	this.device_key = init.device_key;
	this.battery_value = init.battery_value;
	this.date_start = init.date_start;
	this.date_end   = init.date_end;
	this.max_count = init.max_count;
};
var isDefined = function( self, prop ){
	if( !self[prop] ){
		// ここは、正常系では呼ばれないハズなので「console.log()」を直接呼ぶ。
		console.log( "[API_PARAM]::" + prop + " is NOT defind" );
	}
	return self[prop];
};
API_PARAM.prototype.getDeviceKey = function(){ return isDefined( this, "device_key"); };
API_PARAM.prototype.getBatteryValue = function(){ return isDefined( this, "battery_value"); };
API_PARAM.prototype.getStartDate = function(){ return isDefined( this, "date_start"); };
API_PARAM.prototype.getEndDate   = function(){ return isDefined( this, "date_end"); };
API_PARAM.prototype.getMaxCount = function(){ return isDefined( this, "max_count"); };
exports.API_PARAM = API_PARAM;



/**
 * SQL Server への接続テストAPI
 */
exports.api_v1_sql = function( queryFromGet, dataFromPost ){
	var mssql = factoryImpl.mssql.getInstance();
	var config = factoryImpl.CONFIG_SQL.getInstance();
	var connect = mssql.connect( config );

	return connect.then(function(){
		// 何もしない。
	}).catch(function(err){
		return Promise.resolve({
			"jsonData" : err,
			"status" : 500 // Internal Error。
		});
	}).then(function(){
		mssql.close();
		return Promise.resolve({
			"jsonData" : { "result" : "sql connection is OK!" },
			"status" : 200 // OK
		});
	});
};






/**
 * バッテリーログをSQLへ記録するAPI
 */
exports.api_v1_batterylog_add = function( queryFromGet, dataFromPost ){
	var createPromiseForSqlConnection = factoryImpl.sql_parts.getInstance( "createPromiseForSqlConnection" );
	var getInsertObjectFromPostData = factoryImpl.sql_parts.getInstance( "getInsertObjectFromPostData");
	var outJsonData = {};
	var inputData = getInsertObjectFromPostData( dataFromPost );


	// ※データフォーマット違反の場合、Promise.reject()するのだが、そうすると
	//  フォーマットOKでSQL接続のPromiseの生成とを、if文でここに記述する必要がある。
	//  この分岐は共通的なので、createPromise～()に押し込める設計、とした。
	// ・・・と考えていたのだけれど、if文で分けたほうが良い気がしてきた。
	// ⇒変更した。
	// ▼メモ2017.3.6
	// コード共通化はクラス継承で実現すればよい。【後で】
	if( inputData.invalid && inputData.invalid.length > 0 ){
		outJsonData[ "error_on_format" ] = "GET or POST format is INVAILD.";
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : 400 // Bad Request
		});
	}
	
	return createPromiseForSqlConnection( 
		outJsonData, 
		inputData, 
		factoryImpl.CONFIG_SQL.getInstance()
	).then(function( inputData ){
		var param = new API_PARAM( inputData );
		var config = factoryImpl.CONFIG_SQL.getInstance();
		return new Promise(function(resolve,reject){
			var isOwnerValid = factoryImpl.sql_parts.getInstance( "isOwnerValid" );
			var device_key = param.getDeviceKey();
			var is_onwer_valid_promise = isOwnerValid( config.database, device_key );
			is_onwer_valid_promise.then(function( maxCount ){
				resolve({ 
					"device_key" : param.getDeviceKey(), 
					"battery_value" : param.getBatteryValue(),
					"max_count" : maxCount 
				}); // ⇒次のthen()が呼ばれる。
			}).catch(function(err){
				if( err ){
					outJsonData[ "errer_on_validation" ] = err;
					outJsonData[ "errerMessage" ] = "devicePermission of " + device_key + " is false."; 
				}
				reject({
					"http_status" : 401 // Unauthorized
				}); // ⇒次のcatch()が呼ばれる。
			});
		});
		// 【自己メモ】http://azu.github.io/promises-book/#not-throw-use-reject
		// > §4.3.2. thenでもrejectする
		// > このとき、returnしたものがpromiseオブジェクトである場合、そのpromiseオブジェクトの状態によって、
		// > 次の then に登録されたonFulfilledとonRejectedのうち、どちらが呼ばれるかを決めることができます。
	}).then(function( permittedInfomation ){
		// 接続元の接続レート（頻度）の許可／不許可を検証
		var param = new API_PARAM( permittedInfomation );
		var isDeviceAccessRateValied = factoryImpl.sql_parts.getInstance("isDeviceAccessRateValied");
		var config = factoryImpl.CONFIG_SQL.getInstance();
		var limit = factoryImpl.RATE_LIMIT.getInstance();

		return new Promise(function(resolve,reject){
			isDeviceAccessRateValied( 
				config.database, 
				param,
				limit.TIMES_PER_HOUR
			).then(function(result){
				resolve(result);
			}).catch(function(err){
				// アクセス上限エラー。
				reject({
					"http_status" : 503 // Service Unavailable 過負荷
				}); // ⇒次のcatch()が呼ばれる。
			});
		});
	}).then(function( resultAccessRate ){
		var param = new API_PARAM( resultAccessRate );
		var config = factoryImpl.CONFIG_SQL.getInstance();
		var addBatteryLog2Database = factoryImpl.sql_parts.getInstance("addBatteryLog2Database");

		return new Promise(function(resolve,reject){
			addBatteryLog2Database( 
				config.database, 
				param.getDeviceKey(), 
				param.getBatteryValue() 
			).then(function(resultInsert){
				// 「インサート」処理が成功
				// 【FixME】総登録数（対象のデバイスについて）を取得してjsonに含めて返す。取れなければ null でOK（その場合も成功扱い）。
				var param = new API_PARAM(resultInsert);
				outJsonData[ "result" ] = "Success to insert " + param.getBatteryValue() + " as batterylog on Database!";
				outJsonData[ "device_key"] = param.getDeviceKey();
				resolve();
			}).catch(function(err){
				// 「インサート」処理で失敗。
				outJsonData[ "error_on_insert" ];
				reject( err ); // ⇒次のcatch()が呼ばれる。
			});
		});
	}).then(function(){
		// ここまですべて正常終了
		var mssql = factoryImpl.mssql.getInstance();
		mssql.close(); // 【ToDo】create～（）に合わせてWrappwerすべきかな。⇒Test側のstubも合わせて修正。

		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : 200 // OK
		});
	}).catch(function(err){
		// どこかでエラーした⇒エラー応答のjson返す。
		var mssql = factoryImpl.mssql.getInstance();
		var http_status = (err && err.http_status) ? err.http_status : 500;

		mssql.close();
		outJsonData[ "error_on_add" ];
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : http_status
		}); // 異常系処理を終えたので、戻すのは「正常」。
	});
}



/**
 * バッテリーログをSQLから、指定されたデバイス（のハッシュ値）のものを取得する。
 */
exports.api_v1_batterylog_show = function( queryFromGet, dataFromPost ){
	// 接続要求のデータフォーマットを検証＆SQL接続を生成
	var createPromiseForSqlConnection = factoryImpl.sql_parts.getInstance( "createPromiseForSqlConnection" );
	var getShowObjectFromGetData = factoryImpl.sql_parts.getInstance( "getShowObjectFromGetData" );
	var outJsonData = {};
	var inputData = getShowObjectFromGetData( queryFromGet );

	// メモ2017.3.6
	// コード共通化はクラス継承で実現すればよい。【後で】
	if( inputData.invalid && inputData.invalid.length > 0 ){
		outJsonData[ "error_on_format" ] = "GET or POST format is INVAILD.";
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : 400 // Bad Request
		});
	}
	return createPromiseForSqlConnection( 
		outJsonData, 
		inputData, 
		factoryImpl.CONFIG_SQL.getInstance()
	).then(function( inputData ){
		// 接続元の認証Y/Nを検証。
		var param = new API_PARAM( inputData );
		return new Promise(function(resolve,reject){
			var config = factoryImpl.CONFIG_SQL.getInstance();
			var isOwnerValid = factoryImpl.sql_parts.getInstance( "isOwnerValid" );
			var is_onwer_valid_promise = isOwnerValid( 
				config.database, 
				param.getDeviceKey() 
			);
			is_onwer_valid_promise.then(function( maxCount ){
				resolve({ 
					"device_key" : param.getDeviceKey(), 
					"date_start" : param.getStartDate(),
					"date_end" : param.getEndDate(),
					"max_count" : maxCount 
				}); // ⇒次のthen()が呼ばれる。
			}).catch(function(err){
				if( err ){
					outJsonData[ "errer_on_validation" ] = err;
				}
				reject({
					"http_status" : 401 // Unauthorized
				}); // ⇒次のcatch()が呼ばれる。
			});
		});
	}).then(function( permittedInfomation ){
		// 接続元の接続レート（頻度）の許可／不許可を検証
		var param = new API_PARAM( permittedInfomation );
		var isDeviceAccessRateValied = factoryImpl.sql_parts.getInstance("isDeviceAccessRateValied");
		var config = factoryImpl.CONFIG_SQL.getInstance();
		var limit = factoryImpl.RATE_LIMIT.getInstance();

		return new Promise(function(resolve,reject){
			isDeviceAccessRateValied( 
				config.database, 
				param,
				limit.TIMES_PER_HOUR
			).then(function(result){
				resolve(result);
			}).catch(function(err){
				// アクセス上限エラー。
				reject({
					"http_status" : 503 // Service Unavailable 過負荷
				}); // ⇒次のcatch()が呼ばれる。
			});
		});
	}).then(function( inputData ){
		// 対象のログデータをSQLへ要求
		var param = new API_PARAM( inputData );
		var config = factoryImpl.CONFIG_SQL.getInstance();
		var getListOfBatteryLogWhereDeviceKey = factoryImpl.sql_parts.getInstance( "getListOfBatteryLogWhereDeviceKey" );

		return new Promise(function(resolve,reject){
			getListOfBatteryLogWhereDeviceKey(
				config.database, 
				param.getDeviceKey(), 
				{ 
					"start" : param.getStartDate(), 
					"end"   : param.getEndDate()
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
	}).then(function(){
		// ここまですべて正常終了
		var mssql = factoryImpl.mssql.getInstance();
		mssql.close();
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : 200 // OK 【FixMe】直前までの無いように応じて変更する。
		});
	}).catch(function(err){
		// どこかでエラーした⇒エラー応答のjson返す。
		var mssql = factoryImpl.mssql.getInstance();
		var http_status = (err && err.http_status) ? err.http_status : 500;

		mssql.close();
		outJsonData[ "error_on_insert" ];
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : http_status
		}); // 異常系処理を終えたので、戻すのは「正常」。
	});
};




/**
 * バッテリーログをSQLから、指定されたデバイス（のハッシュ値）の、指定された期間を【削除】する。
 */
exports.api_v1_batterylog_delete = function( queryFromGet, dataFromPost ){
	// 接続要求のデータフォーマットを検証＆SQL接続を生成
	var createPromiseForSqlConnection = factoryImpl.sql_parts.getInstance( "createPromiseForSqlConnection" );
	var getDeleteObjectFromGetData = factoryImpl.sql_parts.getInstance( "getDeleteObjectFromGetData" );
	var outJsonData = {};
	var inputData = getDeleteObjectFromGetData( dataFromPost );

	// メモ2017.3.6
	// コード共通化はクラス継承で実現すればよい。【後で】
	if( inputData.invalid && inputData.invalid.length > 0 ){
		outJsonData[ "error_on_format" ] = "GET or POST format is INVAILD.";
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : 400 // Bad Request
		});
	}
	return createPromiseForSqlConnection( 
		outJsonData, 
		inputData, 
		factoryImpl.CONFIG_SQL.getInstance()
	).then(function( inputData ){
		// 接続元の認証Y/Nを検証。
		var param = new API_PARAM( inputData );
		return new Promise(function(resolve,reject){
			var config = factoryImpl.CONFIG_SQL.getInstance();
			var isOwnerValid = factoryImpl.sql_parts.getInstance( "isOwnerValid" );
			var is_onwer_valid_promise = isOwnerValid( 
				config.database, 
				param.getDeviceKey() 
			);
			is_onwer_valid_promise.then(function( maxCount ){
				resolve({ 
					"device_key" : param.getDeviceKey(), 
					"date_start" : param.getStartDate(),
					"date_end" : param.getEndDate(),
					"max_count" : maxCount 
				}); // ⇒次のthen()が呼ばれる。
			}).catch(function(err){
				if( err ){
					outJsonData[ "errer_on_validation" ] = err;
				}
				reject({
					"http_status" : 401 // Unauthorized
				}); // ⇒次のcatch()が呼ばれる。
			});
		});
	}).then(function( permittedInfomation ){
		// 接続元の接続レート（頻度）の許可／不許可を検証
		var param = new API_PARAM( permittedInfomation );
		var isDeviceAccessRateValied = factoryImpl.sql_parts.getInstance("isDeviceAccessRateValied");
		var config = factoryImpl.CONFIG_SQL.getInstance();
		var limit = factoryImpl.RATE_LIMIT.getInstance();

		return new Promise(function(resolve,reject){
			isDeviceAccessRateValied( 
				config.database, 
				param,
				limit.TIMES_PER_HOUR
			).then(function(result){
				resolve(result);
			}).catch(function(err){
				// アクセス上限エラー。
				reject({
					"http_status" : 503 // Service Unavailable 過負荷
				}); // ⇒次のcatch()が呼ばれる。
			});
		});
	}).then(function( inputData ){
		// 対象のログデータをSQLへ要求
		var param = new API_PARAM( inputData );
		var config = factoryImpl.CONFIG_SQL.getInstance();
		var deleteBatteryLogWhereDeviceKey = factoryImpl.sql_parts.getInstance( "deleteBatteryLogWhereDeviceKey" );

		return new Promise(function(resolve,reject){
			deleteBatteryLogWhereDeviceKey(
				config.database, 
				param.getDeviceKey(), 
				{ 
					"start" : param.getStartDate(), 
					"end"   : param.getEndDate()
				}
			).then(function(){
				// 削除処理が成功
				// ※何もしない
				resolve();
			}).catch(function(err){
				// 削除処理で失敗。
				outJsonData[ "error_on_delete" ];
				reject( err ); // ⇒次のcatch()が呼ばれる。
			});
		});
	}).then(function(){
		// ここまですべて正常終了
		var mssql = factoryImpl.mssql.getInstance();
		mssql.close();
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : 200 // OK
		});
	}).catch(function(err){
		// どこかでエラーした⇒エラー応答のjson返す。
		var mssql = factoryImpl.mssql.getInstance();
		var http_status = (err && err.http_status) ? err.http_status : 500;

		mssql.close();
		outJsonData[ "error_on_insert" ];
		return Promise.resolve({
			"jsonData" : outJsonData,
			"status" : http_status
		}); // 異常系処理を終えたので、戻すのは「正常」。
	});
};




