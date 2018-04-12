/*
	[responser_ex.js]

	encoding=utf-8
*/
const debug = require("./debugger.js");



/**
 * @description http.responseを拡張する。JSONを容易に返せるようにする。
 * @param{object} response http.responseを渡す。
 * @param{object} GETメソッドで渡されたオブジェクト→callback JSONP形式で利用する、callback関数名を内部で取得する。null指定可能。
 */
function ResponseExtendJson( response, queryGet ){
	this.itsResponse = response;
	this.itsCallBackName = this.getCallbackFunctionName( queryGet );
};
exports.ResponseExtendJson = ResponseExtendJson;

/**
 * @description レスポンスでJSON応答する。writeHead(), write(), end()まで実施。
 * @param{object} result 応答するJSONオブジェクト。この関数の中でJSON.stringify() して返す。
 * @param{number} httpStatus  省略可能（⇒200[正常])。Httpステータスを指定する。 
 */
ResponseExtendJson.prototype.writeJsonAsString = function( result, httpStatus ){
	var data = JSON.stringify( result );

	httpStatus = httpStatus ? httpStatus : 200; // 省略されてたら「200（正常）」として扱う。
	if( this.itsCallBackName ){
		// http://tsujimotter.info/2013/01/03/jsonp/
		data = this.itsCallBackName + "(" + data + ")";
		this.writeHead( httpStatus, { 
			"Pragma" : "no-cacha", 
			"Cache-Control" : "no-cache",
			"Content-Type" : "application/javascript; charset=utf-8"
		});
	}else{
		this.writeHead( httpStatus, {
			"Access-Control-Allow-Origin" : "*", // JSONはクロスドメインがデフォルトNG。
			"Pragma" : "no-cacha", 
			"Cache-Control" : "no-cache",
			"Content-Type" : "application/json; charset=utf-8"} 
		);
	}
	this.write( data );
	this.end();

	// debug.console_output( this.itsCallBackName ? "[write] - jsonP" : "[write] - json" );
};

ResponseExtendJson.prototype.getCallbackFunctionName = function( queryGet ){
	var callback = null;
	if( queryGet ){
		for (var key in queryGet) { // JSONP 用のcallback関数名を検出
			value = queryGet[key];
			if (key == "callback" ) { // 【ToDo】もう少しちゃんと判定すべきか？
				callback = value;
			}
		}
	}
	return callback;
};

/**
 * @description レスポンスヘッダを送信します。 
 * @param{number} status ステータスコードは 404 のような 3 桁の数字による HTTP ステータスコードです。 
 * @param{object} headers 最後の引数 headers は、レスポンスヘッダです。 
 */
ResponseExtendJson.prototype.writeHead = function( status, headers ){
	this.itsResponse.writeHead( status, headers );
};

/**
 * @description このメソッドが呼び出され、response.writeHead() が呼び出されなければ、 
 * 暗黙的ヘッダモードに切り替わり、暗黙的ヘッダはフラッシュされます。
 * これはレスポンスボディのチャンクを送信します。 このメソッドはボディの連続した部分を提供するために複数回呼び出されるかもしれません。
 */
ResponseExtendJson.prototype.write = function( data ){
	this.itsResponse.write( data );
};

/**
 * @description このメソッドはレスポンスの全てのヘッダとボディを送信したことをサーバに伝えます。
 * サーバはメッセージが終了したと考えるべきです。 
 * この response.end() メソッドは各レスポンスごとに呼び出さなければなりません。
 */
ResponseExtendJson.prototype.end = function(){
	this.itsResponse.end();
};



