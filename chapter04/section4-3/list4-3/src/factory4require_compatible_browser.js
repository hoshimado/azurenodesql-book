/*
    [factory4require_compatible_browser.js]
    encoding=UTF-8
    ※結構、パッチワークなので、あくまで小規模のコレ限定。
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



/**
 * @description require()をラッパーするFactory
 */
var Factory4Require = function( moduleName ){
    var instance = require( moduleName ); // ブラウザ環境で呼ばれたらundefindになる。
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


// Node.js環境のとき、以下を外部公開する。
if( !this.window ){
    exports.Factory = Factory;
    exports.Factory4Require = Factory4Require;
}





