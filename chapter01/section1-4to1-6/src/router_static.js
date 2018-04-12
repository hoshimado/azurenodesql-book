/**
 * [router_static.js]
 * encoding=utf-8
 */

var url = require("url")
var path = require('path');
var fs = require("fs");


var STATIC_HTML_DIR = "html_contents";
const HEADER_BINARY = { 
    "Access-Control-Allow-Origin" : "*",
    "Pragma" : "no-cacha", 
    "Cache-Control" : "no-cache"
};
var HEADER_HTML = { 
    "Content-Type" : "text/html",
    "Access-Control-Allow-Origin" : "*",
    "Pragma" : "no-cacha", 
    "Cache-Control" : "no-cache"
};

exports.isStaticHtmlFound = function( request, response ) {
    return new Promise(function (resolve,reject) {
        var pathname = url.parse( request.url ).pathname;
        var filename = path.join( process.cwd(), STATIC_HTML_DIR + pathname );

        fs.readFile( filename, "binary", function (err, fileData) {
            var extName = path.extname( filename );
            var header;

            if( err ){
                reject();
            }else{
                switch( extName ){
                    case ".html":
                        header = HEADER_HTML;
                        break;
                    default:
                        header = HEADER_BINARY;
                        break;
                }
                response.writeHead( 200, header );
                response.write( fileData, "binary" );
                response.end();
                resolve();
            }
        });
    })
};

