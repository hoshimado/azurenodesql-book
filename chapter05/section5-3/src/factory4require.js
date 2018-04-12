/*
    [factory4require.js]

	encoding=utf-8
*/


/**
 * @description 定数オブジェクトのFactory
 */
var Factory = function( staticInstance ){
    this.instance = staticInstance;
}
Factory.prototype.getInstance = function(){
    return this.instance;
};
// if( 開発環境ならば ){ ～ }などとする。
Factory.prototype.setStub = function( value ){
    this.instance = value;
};
exports.Factory = Factory;



/**
 * @description require()をラッパーするFactory
 */
var Factory4Require = function( moduleName ){
    var instance = require( moduleName );
    Factory.call( this, instance );
}
Factory4Require.prototype = Object.create( Factory.prototype );
Factory4Require.prototype.getInstance = function( methodName ){
	if( methodName ){
		return this.instance[ methodName ];
	} else {
	    return this.instance;
	}
};
exports.Factory4Require = Factory4Require;


