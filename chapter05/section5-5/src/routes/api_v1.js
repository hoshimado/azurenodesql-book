/**
 * [api_v1.js]
 * 
 * encoding=utf-8
 */

var express = require('express');
var router = express.Router();

var lib = require("../api/factory4require.js");
var factoryImpl = { // require()を使う代わりに、new Factory() する。
    "hello" : new lib.Factory4Require("../api/hello.js")
};


router.get('/hello', function(req, res, next) {
    var api_v1_hello = factoryImpl.hello.getInstance().world;
    var header_param = {
        "Access-Control-Allow-Origin" : "*", // JSONはクロスドメインがデフォルトNG。
        "Pragma" : "no-cacha", 
        "Cache-Control" : "no-cache",
        "Content-Type" : "application/json; charset=utf-8"
    };

	return api_v1_hello( req.query, null ).then((result)=>{
        res.header( // res.set(field [, value]) Aliased as res.header(field [, value]).
            header_param
        );
		res.status(result.status).send( result.jsonData );
		res.end();
	}).catch((err)=>{
        res.header(
            header_param
        );
		res.status(500).send( err );
		res.end();
	});
});

module.exports = router;


