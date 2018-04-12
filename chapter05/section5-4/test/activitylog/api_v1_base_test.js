
/*
	[api_v1_base_test.js]

	encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;
require('date-utils');
var ApiCommon_StubAndHooker = require("../support_stubhooker.js").ApiCommon_StubAndHooker;

var api_v1_base = require("../../src/api/activitylog/api_v1_base.js");


var TEST_CONFIG_SQL = { // テスト用
	database : "fake_db_name.sqlite3"
};
var lib = require("../../src/api/factory4require.js");
var strategy_hook = {
    "factoryImpl" : { // require()を使う代わりに、new Factory() する。
        "sql_parts" : new lib.Factory4Require("./sql_db_io/index.js"),
        "CONFIG_SQL" : new lib.Factory({"database" : TEST_CONFIG_SQL})
    }
};



describe( "api_v1_base.js", function(){
    var COMMON_STUB_MANAGER = new ApiCommon_StubAndHooker(function(){
        return {
            "CONFIG_SQL" : TEST_CONFIG_SQL, 
            "sql_parts" : { // API_V1_BASEへ渡すStrategyは、以下のメソッドを持てばよい。
                "createPromiseForSqlConnection" : sinon.stub(),
                "closeConnection" : sinon.stub(),
                "isOwnerValid" : sinon.stub()
            } // 逆に、この3つの実装がデグレした場合は、このテストドライバーのhookInstance()のところでNGになるハズ。
        };
    });

    describe("::api_v1_activitylog_BASE()", function() {
        var stubs;
        var API_V1_BASE = api_v1_base.API_V1_BASE;

        /**
         * @type beforeEachで初期化される。
         */
        beforeEach(function(){ // 内部関数をフックする。
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( strategy_hook, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( strategy_hook );
        });

        // ここからテスト。
        it("正常系", function(){
            var instance = new API_V1_BASE( 
                strategy_hook.factoryImpl.CONFIG_SQL, 
                strategy_hook.factoryImpl.sql_parts 
            );
            var spied_requestSql = sinon.spy( instance, "requestSql" );
            var inputData = {
                "device_key" : "これは識別キー。必ず必要",
                "pass_key"   : "これもセットで識別する。"
            };
            var EXPECTED_MAX_COUNT = 32;

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );

            return shouldFulfilled(
                instance.run( inputData )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );

                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[1] ).to.equal( inputData.device_key );
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[2] ).to.equal( inputData.pass_key ); 

                assert( spied_requestSql.calledOnce );
                expect( spied_requestSql.getCall(0).args[0] ).to.have.property("getDeviceKey");
                expect( spied_requestSql.getCall(0).args[0] ).to.have.property("getPassKey");
                expect( spied_requestSql.getCall(0).args[0] ).to.have.property("getTypeValue");
               
                expect( result ).to.be.exist;
                expect( result ).to.have.property("jsonData");
                expect( result ).to.have.property("status").to.equal(200);
            });
        });
        it("異常系：認証NGの401");
    });
    
});
/*
    参照先Webページメモ
    http://chaijs.com/api/bdd/
    http://sinonjs.org/docs/
    http://qiita.com/xingyanhuan/items/da9f814ce4bdf8f80fa1
    http://azu.github.io/promises-book/#basic-tests
*/






