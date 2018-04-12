/*
	[http_router.js]

	encoding=utf-8
*/


const path = require('path');
const url = require("url")
const fs = require("fs");
const qs = require("qs");
const debug = require("./debugger.js");

const STATIC_HTML_DIR = "/html_contents";


// 参考サイト
// http://shimz.me/blog/node-js/2690
//
const _StaticResponse = {
	"200" : function( response, fileHandle, fileName ){
		const extName = path.extname( fileName );
		const headerBinary = { 
			"Access-Control-Allow-Origin" : "*",
			"Pragma" : "no-cacha", 
			"Cache-Control" : "no-cache"
		};
		const headerHtml = { 
			"Content-Type" : "text/html",
			"Access-Control-Allow-Origin" : "*",
			"Pragma" : "no-cacha", 
			"Cache-Control" : "no-cache"
		};
		var header;

		switch( extName ){
			case ".html":
				header = headerHtml;
				break;
			default:
				header = headerBinary;
				break;
		}
		response.writeHead( 200, header );
		response.write( fileHandle, "binary" );
		response.end();
	},
	"404" : function( response ){
		debug.console_output( " - 404" );

		response.writeHead(404, {"Content-Type": "text/html"});
		response.write("<html><head><title>404 Not Found</title></head><body>404 Not Found.</body>\n");
		response.end();
	},
	"500" : function( response, err){
		debug.console_output( " - 500 with " + err + "]." );

		response.writeHead(500, {"Content-Type": "text/plain"});
		response.write(err + "\n");
		response.end();
	}
};


const _staticHtmlAction = function( pathname ){
	return function( response ){
		var filename = path.join( process.cwd(), STATIC_HTML_DIR + pathname );
		// debug.console_output( "filename is [" + filename + "].");
	
		fs.exists( filename, function( exists ){
			// debug.console_output( filename+" "+exists );
			if( !exists ) { 
				// debug.console_output( "the file is NOT found." );
				_StaticResponse["404"]( response );
			} else {
				if( fs.statSync( filename ).isDirectory() ){ 
					filename += '/index.html'; 
				}
				// debug.console_output( "the file is found. - " + filename );

				fs.readFile( filename, "binary", function( err, file ){
					if( err ){ 
						_StaticResponse["500"]( response, err ); 
					} else {
						_StaticResponse["200"]( response, file, filename );
					}
				}); 
			}
		});
	};
};




const route = function( request, actionHandler ) {
	var pathname = url.parse( request.url ).pathname;
	var patharray, api_name;

	debug.console_output( "[Request] for " + pathname + " received.");
	if( pathname.match(/^\/api\//i) ){ // APIのとき
		patharray = pathname.split( "/" );
		api_name = patharray.join( "_" ).substr( 1 );

		debug.console_output( "API name is [" + api_name + "].");

		if( actionHandler.hasOwnProperty( api_name ) ){
			// 本来は、server.js側に手を入れるべきかもだが、とりあえずここでラッパーする。
			// 必要なら後日にもう一回リファクタリングする。
			return function( responseEx, queryGetMethod, dataPostMethod ){
				var api = actionHandler[ api_name ];
				return api( queryGetMethod, dataPostMethod ).then(function(result){
					var json_data = result.jsonData;
					var http_status = result.status;
					// 【ToDo】↑ここのオブジェクト、new ほげほげ() で、メンバ固定させる手、の方がよいかも？
					//        resolve( new ResponseResult( jsonData, status ) );とか。

					responseEx.writeJsonAsString( json_data, http_status );
				});
			};
		}else{
			return _StaticResponse["404"];
		}
	}else{ // API以外のとき
		debug.console_output( "Just Static HTML file is called. - [" + pathname + "].");
		return _staticHtmlAction( pathname );
	}
};


// http.createServer::request から、GETメソッドの query オブジェクトを切り出す。
// 戻り値は、非同期のPOST動作に合わせて、Promiseインスタンスとする。
//
const getGetQuery = function( request ){ 
	return new Promise( function(resolve, reject) {
		if( request.method == "GET" ){
			resolve( url.parse(request.url, true).query ); // query オブジェクトを返却。
		} else {
			resolve( null ); // 対象外の場合は「成功」で且つ「データなし」
		}
	});
};


// http.createServer::request から、POSTメソッドの query オブジェクトを切り出す。
// 戻り値は、非同期動作のため、Promiseインスタンスとする。
//
const getPostData = function( request ){
	return new Promise( function(resolve, reject) { // http://azu.github.io/promises-book/
		if( request.method == "POST" ){
			var isResolved = false, postData = "";

			request.setEncoding("utf8");
			request.addListener("data", function (postDataChunk) {
				postData += postDataChunk;
				debug.console_output("Received POST data chunk '" + postDataChunk + "'.");
			});
			request.addListener("end", function () {
				postData = qs.parse(postData); // http://codedehitokoto.blogspot.jp/2012/05/qs.html

				debug.console_output("Received ALL POST datas is here:");
				debug.console_output("+++");
				debug.console_output( postData );
				debug.console_output("---");

				isResolved = true;
				resolve( postData );
			});

			// 念のためタイムアウト処理を入れておく。
			setTimeout( function(){
				if( !isResolved ){
					reject(); // エラー扱い。
				}
			}, 10000 ); // 10秒で切る。
		} else {
			resolve( null ); // 対象外の場合は「成功」で且つ「データなし」
		}
	});
};
// http://onlineconsultant.jp/pukiwiki/?node.js%20GET%20POST%E3%83%91%E3%83%A9%E3%83%A1%E3%83%BC%E3%82%BF%E3%83%BC%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B



exports.route = route;
exports.getGetQuery = getGetQuery;
exports.getPostData = getPostData;



