/**
 * [api_v1_base.js]
 * 
 * encoding=utf-8
 */

var lib = require("../factory4require.js");
var factoryImpl = { // require()を使う代わりに、new Factory() する。
    "sql_parts" : new lib.Factory4Require("./sql_db_io/index.js"),
};
var _SQL_CONNECTION_CONFIG = require("../sql_config.js");
factoryImpl[ "CONFIG_SQL" ] = new lib.Factory(_SQL_CONNECTION_CONFIG.CONFIG_SQL);
factoryImpl[ "SETUP_KEY" ]  = new lib.Factory( _SQL_CONNECTION_CONFIG.SETUP_KEY );


// UTデバッグ用のHookポイント。運用では外部公開しないメソッドはこっちにまとめる。
exports.factoryImpl = factoryImpl;


exports.api_v1_activitylog_setup = function( queryFromGet, dataFromPost ){
    var createPromiseForSqlConnection = factoryImpl.sql_parts.getInstance().createPromiseForSqlConnection;
	var outJsonData = {};
	var config = factoryImpl.CONFIG_SQL.getInstance();
	
	if( dataFromPost.create_key != factoryImpl.SETUP_KEY.getInstance() ){
		return Promise.resolve({
			"jsonData" : outJsonData, // 何も入れないまま。
			"status" : 403 // Forbidden
		});
	}
	return createPromiseForSqlConnection(
		config
	).then( ()=>{
		var setupTable1st = factoryImpl.sql_parts.getInstance().setupTable1st;
		return setupTable1st( config.database );
	}).then( (successResultOfTable)=>{
		outJsonData [ "tables" ] = successResultOfTable;
		return Promise.resolve(200);
	}).catch((err)=>{
		outJsonData [ "setup_err" ] = err;
		return Promise.resolve(500);
	}).then(( httpStatus )=>{
		var closeConnection = factoryImpl.sql_parts.getInstance().closeConnection;
		return new Promise((resolve,reject)=>{
			closeConnection( config.database ).then(()=>{
				resolve({
					"jsonData" : outJsonData,
					"status" : httpStatus
				});
			});		
		});
	});
};



