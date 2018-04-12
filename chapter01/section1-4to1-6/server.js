/**
 * [server.js]
 * encoding=utf-8
 */

 
var http = require("http");

var router = require("./src/router_static.js");
var api = require("./src/api.js")

var port = process.env.PORT || 8037;

http.createServer(function (request, response) {
    var promise = router.isStaticHtmlFound(  request, response  );

    promise.catch(function(){
        // 静的htmlファイル予備では【なかった】場合に、RESTful API呼び出しとして扱う。
        return api.responseApi( request, response );
    });
}).listen( port );
console.log("Server has started. - http://127.0.0.1:" + port +"/");


