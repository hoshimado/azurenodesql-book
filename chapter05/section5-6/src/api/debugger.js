/*
	[debugger.js]

*/

const console_output = function( str ){
	if( process.env.DEBUG ){
		console.log( str );
	}
}

exports.console_output = console_output;



