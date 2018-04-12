/**
 * [scraping.js]
 * encoding=utf-8
 */

require('date-utils');

var api_impl = {
    "fs" : require('fs'),
    "cheerioHttp" : require('cheerio-httpcli'),
    "cheerio" : require('cheerio')
};
exports.api_impl = api_impl;

var CACHE_PATH = "./data/cache.html";
var EVENTE_TITLE = process.env.SEARCH_KEYWORD || "#3good";
var SEARCH_KEYWORD = EVENTE_TITLE;
SEARCH_KEYWORD = SEARCH_KEYWORD.replace(/#/, '%23');


var isCacheUse = function () {
    return new Promise(function (resolve,reject) {
        api_impl.fs.stat(CACHE_PATH, function (err,stats) {
            var last_changed_time, limit_date = new Date();
            if(err){
                reject(err);
            }else{
                // The timestamp indicating the last time this file was modified.
                // https://nodejs.org/api/fs.html#fs_stats_mtime
                last_changed_time = new Date(stats.mtime);
                limit_date.setDate(limit_date.getDate() - 1);

                if( limit_date < last_changed_time ){
                    resolve();
                }else{
                    reject();
                }
            }
        });
    });    
};
api_impl.isCacheUse = isCacheUse;



var parseTweetFromCheerio = function ($) {
	var itemHeaders = $("div[class=stream-item-header]");
	var itemContenters = $("div[class=js-tweet-text-container]");

	var n = itemHeaders.length;
    var headerMarker, headerSpan, container;
    var resultArray = [];
	while (0<n--) {
		// headerMarker = itemHeaders.eq(n).find("a[class='tweet-timestamp js-permalink js-nav js-tooltip']").eq(0);
		headerSpan   = itemHeaders.eq(n).find("span[data-time-ms]").eq(0);
        // container = itemContenters.eq(n);
        resultArray.push( new Date(parseInt(headerSpan.attr("data-time-ms"),10)) );
    }
    return resultArray;
};
api_impl.parseTweetFromCheerio = parseTweetFromCheerio;


var fetchAndWriteCacheOnCherrioHttpCli = function () {
    var promiseCheerio = api_impl.cheerioHttp.fetch( 
        "https://twitter.com/search", 
        {
            "q" : SEARCH_KEYWORD
        }
    );

	return new Promise(function (resolve, reject) {
		promiseCheerio.then( function( cheerioResult ){
			if( cheerioResult.error ){
                // 【ToDo】エラー処理
                console.log( cheerioResult.error )
				reject( cheerioResult.error );
			}else{
				// レスポンスヘッダを参照
				// console.log("レスポンスヘッダ");
				// console.log( cheerioResult.response.headers);
	
				// HTMLとして、cheerio互換のノードをキャッシュファイルに保存する。
                var $ = cheerioResult.$;
                api_impl.fs.writeFile(CACHE_PATH, $.html(), "utf-8", function(err){
                    if(err){
                        reject(err);
                    }else{
                        resolve();
                    }
                });
                // Asynchronously writes data to a file, replacing the file if it already exists. data can be a string or a buffer.
                // https://nodejs.org/api/fs.html#fs_fs_writefile_file_data_options_callback
			}
		}).catch( function( err ){
            // 【ToDo】エラー処理
            console.log( err )
			reject({ 
				"message" : "cheerio is ok, BUT clearly() is failed.",
				"error" : err 
			});
		});
	});
    

};
api_impl.fetchAndWriteCacheOnCherrioHttpCli = fetchAndWriteCacheOnCherrioHttpCli;


var readCacheHtmlAndParseToEventArray = function () {
    var promise = new Promise((resolve,reject)=>{
        api_impl.fs.readFile( CACHE_PATH, "utf-8", function (err, data) {
            if(err){
                reject(err);
            }else{
                resolve(data)			
            }
        });
    })
    return promise.then((data)=>{
        var $ = api_impl.cheerio.load( data, {"decodeEntities" : false} );
        var array = api_impl.parseTweetFromCheerio( $ );
        var result = {
            "httpStatus" : 200,
            "data" : []
        }; 
        var i, n = array.length - 1, dt;
        for(i=0;i<n;i++){
            dt = array[i];
            result.data.push(
                {"start" : dt.toFormat("YYYY-MM-DD"), "title" : EVENTE_TITLE }
            );
        }
        return Promise.resolve( result );
    }).catch((err)=>{
        console.log(err);
        return Promise.resolve({
            "httpStatus" : 200,
            "data" : []
        });
    });
};
api_impl.readCacheHtmlAndParseToEventArray = readCacheHtmlAndParseToEventArray;


exports.getEventFromTwitter = function () {
    var promise = api_impl.isCacheUse();
    return promise.catch(function(){
        return api_impl.fetchAndWriteCacheOnCherrioHttpCli();
    }).then(function () {
        return api_impl.readCacheHtmlAndParseToEventArray();
    });
};



