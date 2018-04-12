/**
 * [api.js]
 */

var url = require("url")

var authentication = require("./authentication.js");
var scraping = require("./scraping.js");

var HEADER_JSON = {
    "Access-Control-Allow-Origin" : "*", // JSONはクロスドメインがデフォルトNG。
    "Pragma" : "no-cacha", 
    "Cache-Control" : "no-cache",
    "Content-Type" : "application/json; charset=utf-8"
};
var HEADER_TEXT = {
    "Access-Control-Allow-Origin" : "*",
    "Pragma" : "no-cacha", 
    "Cache-Control" : "no-cache",
    "Content-Type" : "text/html"
};
var getGetQuery = function( request ){ 
	return new Promise( function(resolve) {
		if( request.method == "GET" ){
			resolve( url.parse(request.url, true).query ); // query オブジェクトを返却。
		} else {
			resolve( null ); // 対象外の場合は「成功」で且つ「データなし」
		}
	});
};


exports.responseApi = function( request, response ) {
	var promiseGetQuery = getGetQuery( request );

    return Promise.all( 
		[promiseGetQuery] /* postDataのパースは非同期なので、追加できるように非同期にしておく */
	).then( function( parseResult ){
        var queryGetMethod = parseResult[0];
console.log(queryGetMethod);
        var pathname = url.parse( request.url ).pathname;
        var result = {
            httpStatus : 500,
            data : {}
        };

        // 本サンプルコードでは、簡単のためif分で簡単に分岐させている。
        // 本来は、ルーター機能を別建てして行うのが良い。
        if( pathname == "/api/v1/show/version" ){
            // バージョン表示API
            return Promise.resolve({
                "httpStatus" : 200,
                "data" : {
                    "version" : "1.00"
                }
            });
        }else if( !authentication.isOwnerValid( queryGetMethod ) ){
            // 上記以外は認証を経る事。
            result.httpStatus = 401;
            return Promise.resolve( result );
        }else if( pathname == "/api/v1/show/event" ){
            // スクレイピングAPI
            return scraping.getEventFromTwitter();
        }else{
            // サポート外のAPI
            result.httpStatus = 404;
            return Promise.resolve( result );
        }
    }).then(function (result) {
        response.writeHead( 
            result.httpStatus, 
            HEADER_JSON
        );
        response.write( JSON.stringify( result.data ) );
        response.end();
    }).catch(function( err ) {
        response.writeHead( 
            500, 
            HEADER_TEXT
        );
        response.write( JSON.stringify( err ) );
        response.end();

        console.log(err);
	});
};

