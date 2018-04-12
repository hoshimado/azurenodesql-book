
/*
	[user_manager_test.js]

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

const activitylog = require("../../src/api/activitylog/user_manager.js");

var TEST_CONFIG_SQL = { // テスト用
	database : "fake_db_name.sqlite3"
};


describe( "user_manager.js", function(){

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
    

    describe("::api_v1_activitylog_signup()",function(){
        var stubs, original = {};
        beforeEach(function(){ // 内部関数をフックする。
            original["MAX_USERS"] = activitylog.factoryImpl.MAX_USERS.getInstance();
            original["MAX_LOGS"]  = activitylog.factoryImpl.MAX_LOGS.getInstance();
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
            activitylog.factoryImpl.MAX_USERS.setStub( original.MAX_USERS );
            activitylog.factoryImpl.MAX_LOGS.setStub(  original.MAX_LOGS );
        });

        it("正常系：新規ユーザー追加", function(){
            var EXPECTED_MAX_LOGS_FOR_THE_USER = 256
            var queryFromGet = null;
            var dataFromPost = { 
                "username" : "nyan1nyan2nyan3nayn4nayn5nyan6ny",
                "passkey"  : "cat1cat2"
            };
            var api_v1_activitylog_signup = activitylog.api_v1_activitylog_signup;

            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.withArgs( TEST_CONFIG_SQL.database ).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.reject({
                    "isDevicePermission" : false,
                    "isUserExist" : false
                })
            );
            stubs.sql_parts.getNumberOfUsers.withArgs( TEST_CONFIG_SQL.database ).returns(
                Promise.resolve( 15 ) // 登録済みのユーザー数
            );
            activitylog.factoryImpl.MAX_USERS.setStub( 16 ); // 上限値として設定されているユーザー数
            stubs.sql_parts.addNewUser.onCall(0).returns(
                Promise.resolve()
            );
            activitylog.factoryImpl.MAX_LOGS.setStub( EXPECTED_MAX_LOGS_FOR_THE_USER );

           

            return shouldFulfilled(
                api_v1_activitylog_signup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                assert( stubs.sql_parts.getNumberOfUsers.calledOnce );
                assert( stubs.sql_parts.addNewUser.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );

                expect( stubs.sql_parts.addNewUser.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.addNewUser.getCall(0).args[1] ).to.equal( dataFromPost.username );
                expect( stubs.sql_parts.addNewUser.getCall(0).args[2] ).to.equal( EXPECTED_MAX_LOGS_FOR_THE_USER );
                expect( stubs.sql_parts.addNewUser.getCall(0).args[3] ).to.equal( dataFromPost.passkey );
                
                expect( result ).to.have.property( "jsonData" );
                expect( result.jsonData ).to.have.property( "signuped" ).to.deep.equal({
                    "device_key" : dataFromPost.username,
                    "password"   : dataFromPost.passkey
                });
                expect( result ).to.have.property( "status" ).to.equal( 200 );
            });
        });
        it("正常系：既存ユーザーは、追加しないがOK応答する。", function(){
            var EXPECTED_MAX_LOGS_FOR_THE_USER = 256
            var queryFromGet = null;
            var dataFromPost = { 
                "username" : "nyan1nyan2nyan3nayn4nayn5nyan6ny",
                "passkey"  : "cat1cat2"
            };
            var api_v1_activitylog_signup = activitylog.api_v1_activitylog_signup;

            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.withArgs( TEST_CONFIG_SQL.database ).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_LOGS_FOR_THE_USER )
            );

            return shouldFulfilled(
                api_v1_activitylog_signup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                assert( stubs.sql_parts.getNumberOfUsers.notCalled );
                assert( stubs.sql_parts.addNewUser.notCalled );
                assert( stubs.sql_parts.closeConnection.calledOnce );

                expect( result ).to.have.property( "jsonData" );
                expect( result.jsonData ).to.have.property( "signuped" );
                expect( result.jsonData.signuped ).to.deep.equal({
                    "device_key" : dataFromPost.username,
                    "password"   : dataFromPost.passkey,
                    "left" : EXPECTED_MAX_LOGS_FOR_THE_USER// isOwnerValid()が返した数値
                });
                expect( result ).to.have.property( "status" ).to.equal( 200 );
            });
        });
        it("正常系：既存ユーザーだが、パスワードが異なる。", function(){
            var queryFromGet = null;
            var dataFromPost = { 
                "username" : "nyan1nyan2nyan3nayn4nayn5nyan6ny",
                "passkey"  : "imposter_faker"
            };
            var api_v1_activitylog_signup = activitylog.api_v1_activitylog_signup;

            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.withArgs( TEST_CONFIG_SQL.database ).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.reject({
                    "isDevicePermission" : false,
                    "isUserExist" : true
                })
            );

            return shouldFulfilled(
                api_v1_activitylog_signup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( stubs.sql_parts.getNumberOfUsers.callCount ).to.equal( 0, "getNumberOfUsers()が呼ばれてないこと" );
                expect( stubs.sql_parts.addNewUser.callCount ).to.equal( 0, "addNewUser()が呼ばれてないこと" );
                assert( stubs.sql_parts.closeConnection.calledOnce );

                expect( result.jsonData ).to.have.property( "errorMessage" );
                expect( result.jsonData.errorMessage ).to.equal("The username is already in use.");
                expect( result ).to.have.property( "status" ).to.equal( 401 );
            });
        });

        it("異常系：ユーザー数が上限に達した", function(){
            var queryFromGet = null;
            var dataFromPost = { 
                "username" : "nyan1nyan2nyan3nayn4nayn5nyan6ny",
                "passkey"  : "cat1cat2"
            };
            var api_v1_activitylog_signup = activitylog.api_v1_activitylog_signup;

            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.withArgs( TEST_CONFIG_SQL.database ).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.reject({"here" : "is new user"})
            );
            stubs.sql_parts.getNumberOfUsers.withArgs( TEST_CONFIG_SQL.database ).returns(
                Promise.resolve( 16 ) // 登録済みのユーザー数
            );
            activitylog.factoryImpl.MAX_USERS.setStub( 16 ); // 上限値として設定されているユーザー数
           

            return shouldFulfilled(
                api_v1_activitylog_signup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                assert( stubs.sql_parts.getNumberOfUsers.calledOnce );
                expect( stubs.sql_parts.addNewUser.callCount ).to.equal( 0, "addNewUser()が呼ばれてないこと" );
                assert( stubs.sql_parts.closeConnection.calledOnce );

                expect( result ).to.have.property( "jsonData" );
                expect( result.jsonData ).to.have.property( "errorMessage" );
                expect( result.jsonData.errorMessage ).to.equal("the number of users is over.");
                expect( result ).to.have.property( "status" ).to.equal( 429 ); // Too Many Requests(リクエストの回数制限に引っかかる場合など)
            });
        });
    });
    describe("::api_v1_activitylog_remove() over API_V1_BASE()",function(){
        // ※アカウント作成なので、この位置に記述しているが、実装的には、
        //   後述のinsert系と同様に API_V1_BASE() の認証機構とQuery発行フローをそのまま利用。
        var stubs;
        var api_v1_activitylog_remove = activitylog.api_v1_activitylog_remove;

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

        it("正常系", function(){
            var queryFromGet = null;
            var dataFromPost = {
                "device_key" : "ユーザー識別キー",  // ここは、削除期間の生成が特殊⇒全既刊削除、なのでPostを直に参照する
                "pass_key" : "ユーザー毎の認証キー" // そのためこの値に対する変換もテスト対象とする
            };
            var EXPECTED_MAX_COUNT = 32;
            var EXPECTED_LAST_COUNT = 0; // これは、ゼロでなければならない。

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );
            // sql_parts.getDeleteObjectFromPostData() は呼ばない。期間指定せず、すべてのログを削除するので、通常と異なる。
            stubs.sql_parts.deleteActivityLogWhereDeviceKey.onCall(0).returns(
                Promise.resolve()
            );
            stubs.sql_parts.getNumberOfLogs.onCall(0).returns(
                Promise.resolve( EXPECTED_LAST_COUNT )
            );

            // 対象ユーザーのログを削除したのち、アカウントも削除する。
            stubs.sql_parts.deleteExistUser.onCall(0).returns(
                Promise.resolve()
            );
        
            return shouldFulfilled(
                api_v1_activitylog_remove( queryFromGet, dataFromPost )
            ).then(function( result ){
                
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce, "createPromiseForSqlConnection()が1度呼ばれる" );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                // ここまでは、API_V1_BASE()で検証済みなので、簡易検証。

                // isOwnerValid()へ渡されるパラメータを直に検証する。
                // 何故なら「get～()で生成したオブジェクトを直に渡す」ではなく、このテスト対象の中で生成するから。
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[1] ).to.equal( dataFromPost.device_key );
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[2] ).to.equal( dataFromPost.pass_key );
                
                var deletedResponse = stubs.sql_parts.deleteActivityLogWhereDeviceKey;
                assert( deletedResponse.calledOnce, "SQLへのログ削除クエリー。deleteActivityLogWhereDeviceKey()が1度呼ばれること。" );
                expect( deletedResponse.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( deletedResponse.getCall(0).args[1] ).to.equal( dataFromPost.device_key );
                expect( deletedResponse.getCall(0).args[2] ).to.be.null; // { start, end } を指定しない。⇒全期間が対象になる。

                assert( stubs.sql_parts.getNumberOfLogs.calledOnce, "getNumberOfLogs()が1度だけ呼ばれること。" );
                expect( stubs.sql_parts.getNumberOfLogs.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.getNumberOfLogs.getCall(0).args[1] ).to.equal( dataFromPost.device_key );

                assert( stubs.sql_parts.deleteExistUser.calledOnce, "deleteExistUser()が1度だけ呼ばれること。" );
                expect( stubs.sql_parts.deleteExistUser.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.deleteExistUser.getCall(0).args[1] ).to.equal( dataFromPost.device_key );

                expect( result ).to.be.exist;
                expect( result ).to.have.property("status").to.equal(200);
                expect( result ).to.have.property("jsonData");
                expect( result.jsonData ).to.have.property( "removed" );
                expect( result.jsonData.removed ).to.deep.equal({
                    "device_key" : dataFromPost.device_key
                });

            });
        });
        it("異常系：SQLログの削除は成功を返したが、残存ログがある（が発生得るかは不明だが）");
    });

});
/*
    参照先Webページメモ
    http://chaijs.com/api/bdd/
    http://sinonjs.org/docs/
    http://qiita.com/xingyanhuan/items/da9f814ce4bdf8f80fa1
    http://azu.github.io/promises-book/#basic-tests
*/






