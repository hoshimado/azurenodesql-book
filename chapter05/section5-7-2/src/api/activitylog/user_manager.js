/**
 * [user_manager.js]
 * 
 * encoding=utf-8
 */

var lib = require("../factory4require.js");
var API_PARAM = require("./api_param.js").API_PARAM;
var API_V1_BASE = require("./api_v1_base.js").API_V1_BASE;
var factoryImpl = { // require()を使う代わりに、new Factory() する。
    "sql_parts" : new lib.Factory4Require("./sql_db_io/index.js"),
};
var _SQL_CONNECTION_CONFIG = require("../sql_config.js");
factoryImpl[ "CONFIG_SQL" ] = new lib.Factory(_SQL_CONNECTION_CONFIG.CONFIG_SQL);
factoryImpl[ "MAX_USERS"] = new lib.Factory( _SQL_CONNECTION_CONFIG.MAX_USERS );
factoryImpl[ "MAX_LOGS" ] = new lib.Factory( _SQL_CONNECTION_CONFIG.MAX_LOGS );


// UTデバッグ用のHookポイント。運用では外部公開しないメソッドはこっちにまとめる。
exports.factoryImpl = factoryImpl;


exports.api_v1_activitylog_signup = function( queryFromGet, dataFromPost ){
	var createPromiseForSqlConnection = factoryImpl.sql_parts.getInstance().createPromiseForSqlConnection;
	var outJsonData = {};
	var config = factoryImpl.CONFIG_SQL.getInstance();
	
	// ◆ToDo:ここは関数化する。
	if( !(dataFromPost.username) ){ // ◆ToDo:パラメータ検証は要実装◆
		return Promise.resolve({
			"jsonData" : outJsonData, // 何も入れないまま。
			"status" : 403 // Forbidden
		});
	}
	var inputData = { // ◆ToDo:ココの実装は暫定◆
		"device_key" : dataFromPost.username,
		"pass_key"   : dataFromPost.passkey
	};


	return createPromiseForSqlConnection(
		config
	).then(()=>{
		// 先ず既存ユーザーか否かをチェックする。
		var isOwnerValid = factoryImpl.sql_parts.getInstance( "isOwnerValid" );
		var is_onwer_valid_promise = isOwnerValid( 
			config.database, 
			inputData.device_key,
			inputData.pass_key
		);
		return is_onwer_valid_promise.catch(function(err){
			// 未登録ユーザーか、もしくは、登録ユーザーだが「パスワードが不正」の場合はここに来る。
			// expect( err ).to.have.property( "isDevicePermission" ).to.equal( false );
			// expect( err ).to.have.property( "isUserExist" ).to.equal( true );

			// isDevicePermission == false しか、ここには入らないはずだが、念のためチェックする。
			if( !err.isDevicePermission && !err.isUserExist ){
				// 未登録ユーザーの場合はここに来る。
				return new Promise((resolve,reject)=>{
					var getNumberOfUsers = factoryImpl.sql_parts.getInstance().getNumberOfUsers;
	
					var promise = getNumberOfUsers( config.database );
					promise.then((nowNumberOfUsers)=>{
						if( nowNumberOfUsers < factoryImpl.MAX_USERS.getInstance() ){
							resolve();
						}else{
							outJsonData["errorMessage"] = "the number of users is over.";
							reject({
								"status" : 429 // Too Many Requests(リクエストの回数制限に引っかかる場合など)
							});
						}
					}).catch((err)=>{
						outJsonData [ "failed" ] = err;
						reject(err);
					});
				}).then(()=>{
					var addNewUser = factoryImpl.sql_parts.getInstance().addNewUser;
					var max_count = factoryImpl.MAX_LOGS.getInstance();
					// ◆ToDo:↑ユーザーごとの上限データ数は環境変数側で持たせように変更する。◆
	
					return addNewUser( config.database, inputData.device_key, max_count, inputData.pass_key );
				});
			}else{
				// 登録済みユーザーだが、「パスワード」が不正。
                // expect( result.jsonData.errorMessage ).to.equal();
				outJsonData["errorMessage"] = "The username is already in use.";
				err["status"] = 401;
				return Promise.reject(err);
			}
		});
	}).then((result)=>{
		var insertedData = {
			"device_key" : inputData.device_key,
			"password"   : inputData.pass_key
		};

		if( result ){
			// 既存ユーザーだった場合は、残りの登録可能なデータ数返却される。
			insertedData["left"] = result;
		}
		outJsonData [ "signuped" ] = insertedData;
		return Promise.resolve(200);
	}).catch((err)=>{
		var http_status = err.status ? err.status : 500;
		return Promise.resolve(http_status);
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


exports.api_v1_activitylog_remove = function( queryFromGet, dataFromPost ){
	var inputData = {
		"device_key" : dataFromPost.device_key,
		"pass_key"   : dataFromPost.pass_key
	};
	var API_SHOW = function(){
		// サブクラスのコンスタラクタ
		this._outJsonData = {};
		API_V1_BASE.call( this, factoryImpl.CONFIG_SQL, factoryImpl.sql_parts, this._outJsonData ); // 継承元のコンスタラクタを明示的に呼び出す。
	};
	API_SHOW.prototype = Object.create( API_V1_BASE.prototype );
	API_SHOW.prototype.requestSql = function( paramClass ){
		// 関連するログデータをすべて削除。
		var deleteActivityLogWhereDeviceKey = factoryImpl.sql_parts.getInstance().deleteActivityLogWhereDeviceKey;
		var config = factoryImpl.CONFIG_SQL.getInstance();
		var outJsonData = this._outJsonData;
		
		// 対象ユーザーのログをすべて削除する。
		return deleteActivityLogWhereDeviceKey(
			config.database,
			paramClass.getDeviceKey(),
			null
		).then(()=>{
			// 対象ユーザーのログが残ってないことを確認する。
			var getNumberOfLogs = factoryImpl.sql_parts.getInstance().getNumberOfLogs;
			return getNumberOfLogs(
				config.database,
				paramClass.getDeviceKey()
			);
		}).then((numberOfLeft)=>{
			var deleteExistUser = factoryImpl.sql_parts.getInstance().deleteExistUser;
			if( numberOfLeft == 0 ){
				return deleteExistUser(
					config.database,
					paramClass.getDeviceKey()
				);
			}else{
				return Promise.reject(); // 【Todo】異常系の処理は未実装。
			}
		}).then(()=>{
			outJsonData["removed"] = {
				"device_key" : paramClass.getDeviceKey()
			};
		});
	};
	var subInstance = new API_SHOW();
	
	if( !inputData.device_key || !inputData.pass_key ){
		inputData[ "invalid" ] = "parameter is INVAILD.";
	}

	return subInstance.run( inputData );
};


