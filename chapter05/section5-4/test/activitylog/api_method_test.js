
/*
	[api_method_test.js]

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

const activitylog = require("../../src/api/activitylog/api_method.js");

var TEST_CONFIG_SQL = { // テスト用
	database : "fake_db_name.sqlite3"
};


describe( "api_method.js", function(){

    var COMMON_STUB_MANAGER = new ApiCommon_StubAndHooker(function(){
        return {
            "CONFIG_SQL" : TEST_CONFIG_SQL, 
            "sql_parts" : {
                "createPromiseForSqlConnection" : sinon.stub(),
                "closeConnection" : sinon.stub(),
                "isOwnerValid" : sinon.stub(),
                "getNumberOfUsers" : sinon.stub(),
                "setupTable1st" : sinon.stub(),
                "addNewUser" : sinon.stub(),
                "deleteExistUser" : sinon.stub(),
                "getInsertObjectFromPostData" : sinon.stub(),
                "getShowObjectFromGetData" : sinon.stub(),
                "getDeleteObjectFromPostData" : sinon.stub(), 
                "getNumberOfLogs" : sinon.stub(),
                "addActivityLog2Database" : sinon.stub(),
                "getListOfActivityLogWhereDeviceKey" : sinon.stub(),
                "deleteActivityLogWhereDeviceKey" : sinon.stub()
            }
        };
    });

    
    describe("::api_v1_activitylog_show() over API_V1_BASE()", function(){
        var stubs;
        var api_v1_activitylog_show = activitylog.api_v1_activitylog_show;

        /**
         * @type beforeEachで初期化される。
         */
        beforeEach(function(){ // 内部関数をフックする。
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
        });

        // ここからテスト。
        it("正常系", function(){
            var queryFromGet = { "here" : "is スルーパス、なので何でも良い" };
            var dataFromPost = null;
            var EXPECTED_PARAM_WITH_AUTO_DATE = { 
                "device_key" : "これは識別キー。必ず必要",
                "pass_key"   : "これもセットで識別する。",
                "date_start" : "2017-02-01", // queryGetに無い場合でも、getShowObjectFromGetData()でデフォルトを生成する。
                "date_end"   : "2017-02-14"  // 上同。
            };
            var EXPECTED_RECORDSET = [
                {"created_at":"2017-02-08T00:47:25.000Z","type": "101"},
                {"created_at":"2017-02-11T12:36:01.000Z","type": "102"}
            ];
            var EXPECTED_MAX_COUNT = 32;

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );
            stubs.sql_parts.getShowObjectFromGetData.withArgs(queryFromGet).returns( EXPECTED_PARAM_WITH_AUTO_DATE );
            stubs.sql_parts.getListOfActivityLogWhereDeviceKey.onCall(0).returns(
                Promise.resolve( EXPECTED_RECORDSET )
            );

            return shouldFulfilled(
                api_v1_activitylog_show( queryFromGet, dataFromPost )
            ).then(function( result ){
                var stubList = stubs.sql_parts.getListOfActivityLogWhereDeviceKey;
                
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( result ).to.be.exist;
                expect( result ).to.have.property("jsonData");
                expect( result ).to.have.property("status").to.equal(200);
                // ここまでは、API_V1_BASE()で検証済みなので、簡易検証。

                assert( stubs.sql_parts.getShowObjectFromGetData.calledOnce, "呼び出しパラメータの妥当性検証＆整形、が一度呼ばれること" );
                expect( stubs.sql_parts.getShowObjectFromGetData.getCall(0).args[0] ).to.equal(queryFromGet);

                assert( stubList.calledOnce, "SQLへのログ取得クエリー。getListOfActivityLogWhereDeviceKey()が1度呼ばれること。" );
                expect( stubList.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubList.getCall(0).args[1] ).to.equal( EXPECTED_PARAM_WITH_AUTO_DATE.device_key );
                expect( stubList.getCall(0).args[2] ).to.deep.equal({
                    "start" : EXPECTED_PARAM_WITH_AUTO_DATE.date_start,
                    "end"   : EXPECTED_PARAM_WITH_AUTO_DATE.date_end 
                });

                expect( result.jsonData ).to.have.property( "table" );
                expect( result.jsonData.table ).to.deep.equal( EXPECTED_RECORDSET );
            });
        });
        it("異常系::getList～（）の部分");// だけでいい。他の401認証NGとかは、API_V1_BASE()で検証済み。
    });

    describe("::api_vi_activitylog_add() over API_V1_BASE()",function(){
        var stubs;
        var api_v1_activitylog_add = activitylog.api_v1_activitylog_add;

        /**
         * @type beforeEachで初期化される。
         */
        beforeEach(function(){ // 内部関数をフックする。
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
        });

        // ここからテスト。
        it("正常系", function(){
            var queryFromGet = null;
            var dataFromPost = { "here" : "is スルーパス、なので何でも良い" };
            var EXPECTED_CONVERTED_PARAM = { 
                "device_key" : "これは識別キー。必ず必要",
                "pass_key"   : "これもセットで識別する。",
                "type_value" : "101"
            };
            var EXPECTED_MAX_COUNT = 32;
            var EXPECTED_EXISTING_COUNT_OF_LOGS = 31;
            var EXPECTED_INSERTED = {
                "device_key" : "これは識別キー。必ず必要",
                "type_value" : "101"
            };

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );

            stubs.sql_parts.getNumberOfLogs.onCall(0).returns(
                Promise.resolve( EXPECTED_EXISTING_COUNT_OF_LOGS )
            );

            stubs.sql_parts.getInsertObjectFromPostData.withArgs(dataFromPost).returns( EXPECTED_CONVERTED_PARAM );
            stubs.sql_parts.addActivityLog2Database.onCall(0).returns(
                Promise.resolve( EXPECTED_INSERTED )
            );

            return shouldFulfilled(
                api_v1_activitylog_add( queryFromGet, dataFromPost )
            ).then(function( result ){
                var addedResponse = stubs.sql_parts.addActivityLog2Database;
                
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( result ).to.be.exist;
                expect( result ).to.have.property("jsonData");
                expect( result ).to.have.property("status").to.equal(200);
                // ここまでは、API_V1_BASE()で検証済みなので、簡易検証。

                assert( stubs.sql_parts.getNumberOfLogs.calledOnce, "getNumberOfLogs()が一度だけ呼ばれること。記録数上限チェックのために必要" );
                expect( stubs.sql_parts.getNumberOfLogs.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.getNumberOfLogs.getCall(0).args[1] ).to.equal( EXPECTED_CONVERTED_PARAM.device_key );

                assert( stubs.sql_parts.getInsertObjectFromPostData.calledOnce, "呼び出しパラメータの妥当性検証＆整形、が一度呼ばれること" );
                expect( stubs.sql_parts.getInsertObjectFromPostData.getCall(0).args[0] ).to.equal(dataFromPost);

                assert( addedResponse.calledOnce, "SQLへのログ追加クエリー。getListOfActivityLogWhereDeviceKey()が1度呼ばれること。" );
                expect( addedResponse.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( addedResponse.getCall(0).args[1] ).to.equal( EXPECTED_CONVERTED_PARAM.device_key );
                expect( addedResponse.getCall(0).args[2] ).to.equal( EXPECTED_CONVERTED_PARAM.type_value );

                expect( result.jsonData ).to.have.property( "device_key" );
                // jsonData.resultには文字列が入るが、特に規定はしない。
            });
        });
        it("異常系::ログ数が、割り当ての上限数を超えているので、Add出来ない。", function(){
            var queryFromGet = null;
            var dataFromPost = { "here" : "is スルーパス、なので何でも良い" };
            var EXPECTED_CONVERTED_PARAM = { 
                "device_key" : "これは識別キー。必ず必要",
                "pass_key"   : "これもセットで識別する。",
                "type_value" : "101"
            };
            var EXPECTED_MAX_COUNT = 32;
            var EXPECTED_EXISTING_COUNT_OF_LOGS = 32; // 上限値に達しているケース
            var EXPECTED_INSERTED = {
                "device_key" : "これは識別キー。必ず必要",
                "type_value" : "101"
            };

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );

            stubs.sql_parts.getNumberOfLogs.onCall(0).returns(
                Promise.resolve( EXPECTED_EXISTING_COUNT_OF_LOGS )
            );

            stubs.sql_parts.getInsertObjectFromPostData.withArgs(dataFromPost).returns( EXPECTED_CONVERTED_PARAM );

            return shouldFulfilled(
                api_v1_activitylog_add( queryFromGet, dataFromPost )
            ).then(function( result ){
                var addedResponse = stubs.sql_parts.addActivityLog2Database;
                
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( result ).to.be.exist;
                expect( result ).to.have.property("jsonData");
                expect( result ).to.have.property("status").to.equal(429); // Too Many Requests(リクエストの回数制限に引っかかる場合など)
                // ここまでは、API_V1_BASE()で検証済みなので、簡易検証。

                assert( stubs.sql_parts.getNumberOfLogs.calledOnce, "getNumberOfLogs()が一度だけ呼ばれること。記録数上限チェックのために必要" );
                expect( stubs.sql_parts.getNumberOfLogs.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.getNumberOfLogs.getCall(0).args[1] ).to.equal( EXPECTED_CONVERTED_PARAM.device_key );

                assert( stubs.sql_parts.getInsertObjectFromPostData.calledOnce, "呼び出しパラメータの妥当性検証＆整形、が一度呼ばれること" );
                expect( stubs.sql_parts.getInsertObjectFromPostData.getCall(0).args[0] ).to.equal(dataFromPost);

                expect( addedResponse.callCount).to.equal(0, "addActivityLog2Database()は呼ばれないこと" );

                // エラーが入っている事。
                expect( result.jsonData ).to.have.property( "failed" )
                .to.have.property("message")
                .to.equal("There are too many Logs per account.");
            });
        });
        it("異常系::addActivityLog～（）の部分");// だけでいい。他の401認証NGとかは、API_V1_BASE()で検証済み。
    });

    describe("::api_v1_activitylog_delete() over API_V1_BASE()",function(){
        var stubs;
        var api_v1_activitylog_delete = activitylog.api_v1_activitylog_delete;

        /**
         * @type beforeEachで初期化される。
         */
        beforeEach(function(){ // 内部関数をフックする。
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
        });

        // ここからテスト。
        it("正常系", function(){
            var queryFromGet = null;
            var dataFromPost = { "here" : "is スルーパス、なので何でも良い" };
            var EXPECTED_CONVERTED_PARAM = { 
                "device_key" : "これは識別キー。必ず必要",
                "pass_key"   : "これもセットで識別する。",
                "date_end"   : "2017-12-01" // queryGetに無い場合でも、getDeleteObjectFromPostData()でデフォルトを生成する。
            };// date_startプロパティは「無くても」良い。
            var EXPECTED_MAX_COUNT = 32;
            var EXPECTED_LAST_COUNT = 16;

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );
            stubs.sql_parts.getDeleteObjectFromPostData.withArgs(dataFromPost).returns( EXPECTED_CONVERTED_PARAM );
            stubs.sql_parts.deleteActivityLogWhereDeviceKey.onCall(0).returns(
                Promise.resolve()
            );
            stubs.sql_parts.getNumberOfLogs.onCall(0).returns(
                Promise.resolve( EXPECTED_LAST_COUNT )
            );
        
            return shouldFulfilled(
                api_v1_activitylog_delete( queryFromGet, dataFromPost )
            ).then(function( result ){
                
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce, "createPromiseForSqlConnection()が1度呼ばれる" );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( result ).to.be.exist;
                expect( result ).to.have.property("jsonData");
                expect( result ).to.have.property("status").to.equal(200);
                // ここまでは、API_V1_BASE()で検証済みなので、簡易検証。

                assert( stubs.sql_parts.getDeleteObjectFromPostData.calledOnce, "呼び出しパラメータの妥当性検証＆整形、が一度呼ばれること" );
                expect( stubs.sql_parts.getDeleteObjectFromPostData.getCall(0).args[0]).to.equal( dataFromPost );

                var deletedResponse = stubs.sql_parts.deleteActivityLogWhereDeviceKey;
                assert( deletedResponse.calledOnce, "SQLへのログ削除クエリー。deleteActivityLogWhereDeviceKey()が1度呼ばれること。" );
                expect( deletedResponse.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( deletedResponse.getCall(0).args[1] ).to.equal( EXPECTED_CONVERTED_PARAM.device_key );
                expect( deletedResponse.getCall(0).args[2] ).to.deep.equal({
                    "end"   : EXPECTED_CONVERTED_PARAM.date_end
                }); // "start"は無くても良い。

                assert( stubs.sql_parts.getNumberOfLogs.calledOnce, "getNumberOfLogs()が1度だけ呼ばれること。" );
                expect( stubs.sql_parts.getNumberOfLogs.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.getNumberOfLogs.getCall(0).args[1] ).to.equal( EXPECTED_CONVERTED_PARAM.device_key );

                // resultオブジェクトがjsonDataメンバを持つことは、先に検証済み。
                expect( result.jsonData ).to.have.property( "device_key" )
                .to.equal( EXPECTED_CONVERTED_PARAM.device_key );
                expect( result.jsonData ).to.have.property( "number_of_logs" )
                .to.equal( EXPECTED_LAST_COUNT );
            });
        });
        it("異常系::deleteActivityLogWhereDeviceKey()の部分");// だけでいい。他の401認証NGとかは、API_V1_BASE()で検証済み。
    });
    
});
/*
    参照先Webページメモ
    http://chaijs.com/api/bdd/
    http://sinonjs.org/docs/
    http://qiita.com/xingyanhuan/items/da9f814ce4bdf8f80fa1
    http://azu.github.io/promises-book/#basic-tests
*/






