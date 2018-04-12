/*
	[http_server_port8037.js]


*/

const http = require('http');
const responser_ex = require("./src/responser_wrapper.js");
const router = require("./src/http_router.js");
const api_instance_list = require("./src/api_restful_manager.js");
const debug = require("./src/debugger.js");


var port = process.env.PORT || 8037;

http.createServer(function (request, response) {
	const httpResponser = router.route( request, api_instance_list );
	const promisePostData = router.getPostData( request );
	const promiseGetQuery = router.getGetQuery( request );

	Promise.all( 
		[promiseGetQuery, promisePostData]
	).then( function( result ){
		const queryGetMethod = result[0];
		const dataPostMethod = result[1];

		debug.console_output( "[GET]\n"  + JSON.stringify(queryGetMethod) );
		debug.console_output( "[POST]\n" + dataPostMethod );

		httpResponser( 
			new responser_ex.ResponseExtendJson( response, queryGetMethod ), 
			queryGetMethod, dataPostMethod 
		);
	}).catch( function( err ) {
		debug.console_output( err );
		httpResponser( 
			new responser_ex.ResponseExtendJson( response, queryGetMethod ) 
		);
	});
}).listen( port ); 
debug.console_output( "Server has started. - http://127.0.0.1:" + port +"/");





