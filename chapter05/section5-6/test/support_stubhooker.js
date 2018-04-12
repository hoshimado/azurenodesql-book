/*
    [z_stubhooker.js]
	encoding=utf-8
*/


/**
 * api_xxx() のテストで共通的な
 * Stub生成、フック、リストアを行う。
 * (※今回限りなので、prototypeじゃなくてコンストラクタでメソッド定義)
 */
var ApiCommon_StubAndHooker = function( stubsFactory ){
    this.original_prop= {};
    this.stub_keys;
    this.createStubs = stubsFactory;
    /**
     * メソッドをフックしてStubに差し替える。
     * ※オリジナルはバックアップしておく。
     *   「全ての関数をstub outする」の適切か否か不明。
     *   spy使うなら、オリジナルも必要。⇒なので毎回戻して、次回利用可能にしておく。
     */
    this.hookInstance = function( apiInstance, stubs ){
        var stub_keys = Object.keys( stubs );
        var n = stub_keys.length;
        this.stub_keys = stub_keys;

        // オリジナルをバックアップする。
        n = stub_keys.length;
        while( 0<n-- ){
            this.original_prop[ stub_keys[n] ] = apiInstance.factoryImpl[ stub_keys[n] ].getInstance();
        }

        // stubを用いてフックする。
        n = stub_keys.length;
        while( 0<n-- ){
            apiInstance.factoryImpl[ stub_keys[n] ].setStub( stubs[ stub_keys[n] ] );
        }
    };
    this.restoreOriginal = function( apiInstance ){
        var stub_keys = this.stub_keys;
        var n = stub_keys.length;
        while( 0<n-- ){
            apiInstance.factoryImpl[ stub_keys[n] ].setStub( this.original_prop[ stub_keys[n] ] );
        }

    };
};

exports.ApiCommon_StubAndHooker = ApiCommon_StubAndHooker;
