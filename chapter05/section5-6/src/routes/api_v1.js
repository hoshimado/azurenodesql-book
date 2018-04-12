/**
 * [api_v1.js]
 * 
 * encoding=utf-8
 */


var express = require('express');
var router = express.Router();

var console_output = require("../api/debugger.js").console_output;
var lib = require("../api/factory4require.js");
var factoryImpl = { // require()を使う代わりに、new Factory() する。
    "sql_activitylog" : new lib.Factory4Require("../api/activitylog/index.js")
};



/* サンプルAPI① 
 * http://localhost:3000/api/v1/activitylog/test にGETメソッドのリクエストを投げると、
 * JSON形式で文字列を返す。
 */
router.get('/test', function(req, res, next) {
  var param = {
	  "getedQuery" : req.query,
	  "値":"これはGETのサンプルAPIです"
	};
	res.header('Content-Type', 'application/json; charset=utf-8')
	res.send(param);
});

router.post("/test", function(req, res, next){
	var dataPost = req.body; // app.jsで「app.use(bodyParser.json());」してるので、bodyプロパティが使える。
	var param = {
		"postedData" : dataPost,
		"値":"これはPOSTのサンプルAPIです"
	};
	res.header('Content-Type', 'application/json; charset=utf-8')
	res.send(param);
});



// ◆Unitテストに未対応。
var responseNormal = function( res, result ){
	console_output( result );
	
	res.header({ // res.set(field [, value]) Aliased as res.header(field [, value]).
		"Access-Control-Allow-Origin" : "*", // JSONはクロスドメインがデフォルトNG。
		"Pragma" : "no-cacha", 
		"Cache-Control" : "no-cache",
		"Content-Type" : "application/json; charset=utf-8"
	});
	res.status(result.status).send( result.jsonData );
	res.end();
};
/*
    //res.jsonp([body])
	if( this.itsCallBackName ){
		// http://tsujimotter.info/2013/01/03/jsonp/
		data = this.itsCallBackName + "(" + data + ")";
		this.writeHead( httpStatus, { 
			"Pragma" : "no-cacha", 
			"Cache-Control" : "no-cache",
			"Content-Type" : "application/javascript; charset=utf-8"
		});
	}
*/
var responseAnomaly = function( res, err ){
	res.header({ // res.set(field [, value]) Aliased as res.header(field [, value]).
		"Access-Control-Allow-Origin" : "*", // JSONはクロスドメインがデフォルトNG。
		"Pragma" : "no-cacha", 
		"Cache-Control" : "no-cache",
		"Content-Type" : "application/json; charset=utf-8"
	});
	res.status(500).send( err );
	res.end();
};



router.post("/setup1st", function(req, res, next){
	var api_vi_activitylog_setup = factoryImpl.sql_activitylog.getInstance().api_vi_activitylog_setup;
	var dataPost = req.body; // app.jsで「app.use(bodyParser.json());」してるので、bodyプロパティが使える。

	return api_vi_activitylog_setup( null, dataPost ).then((result)=>{
		responseNormal( res, result );
	}).catch((err)=>{
		responseAnomaly( res, err );
	});
});

router.post("/signup", function(req, res, next){
	var api_vi_activitylog_signup = factoryImpl.sql_activitylog.getInstance().api_vi_activitylog_signup;
	var dataPost = req.body;
	return api_vi_activitylog_signup( null, dataPost ).then((result)=>{
		responseNormal( res, result );
	}).catch((err)=>{
		responseAnomaly( res, err );
	});
});

router.post("/remove", function(req, res, next){
	var api_vi_activitylog_remove = factoryImpl.sql_activitylog.getInstance().api_vi_activitylog_remove;
	var dataPost = req.body;
	return api_vi_activitylog_remove( null, dataPost ).then((result)=>{
		responseNormal( res, result );
	}).catch((err)=>{
		responseAnomaly( res, err );
	});
});



router.get('/show', function(req, res, next) {
	var api_v1_activitylog_show = factoryImpl.sql_activitylog.getInstance().api_v1_activitylog_show;

	return api_v1_activitylog_show(req.query, null ).then((result)=>{
		responseNormal( res, result );
	}).catch((err)=>{
		responseAnomaly( res, err );
	});
});

router.post("/add", function(req, res, next){
	var api_v1_activitylog_add = factoryImpl.sql_activitylog.getInstance().api_v1_activitylog_add;
	var dataPost = req.body;
	
	return api_v1_activitylog_add( null, dataPost ).then((result)=>{
		responseNormal( res, result );
	}).catch((err)=>{
		responseAnomaly( res, err );
	});
});

router.post("/delete", function(req, res, nest) {
	var api_v1_activitylog_delete = factoryImpl.sql_activitylog.getInstance().api_v1_activitylog_delete;
	var dataPost = req.body;
	
	return api_v1_activitylog_delete( null, dataPost).then((result)=>{
		responseNormal( res, result );
	}).catch((err)=>{
		responseAnomaly( res, err );
	});
})




module.exports = router;

