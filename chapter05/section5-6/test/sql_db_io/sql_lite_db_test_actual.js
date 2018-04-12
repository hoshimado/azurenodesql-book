/*
    [sql_lite_db_test_actual.js]

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

const sql_parts = require("../../src/api/sql_db_io/index.js");

var TEST_CONFIG_SQL = { // テスト用
	user : "fake_user",
	password : "fake_password",
	server : "fake_server_url", // You can use 'localhost\\instance' to connect to named instance
	database : "./db/mydb.splite3",  //"fake_db_name",
	stream : false,  // if true, query.promise() is NOT work! // You can enable streaming globally

	// Use this if you're on Windows Azure
	options : {
		encrypt : true 
	} // It works well on LOCAL SQL Server if this option is set.
};



// var createPromiseForSqlConnection = function( sqlConfig ){
// var isOwnerValid = function( databaseName, deviceKey ){
// exports.closeConnection = closeConnection;

describe( "sql_lite_db_test_actual.js", function(){
    var createPromiseForSqlConnection = sql_parts.createPromiseForSqlConnection;
    var isOwnerValid = sql_parts.isOwnerValid;
    var closeConnection = sql_parts.closeConnection;
    var addActivityLog2Database = sql_parts.addActivityLog2Database;
    var getListOfActivityLogWhereDeviceKey = sql_parts.getListOfActivityLogWhereDeviceKey;
    var addNewUser = sql_parts.addNewUser;
    var getNumberOfUsers = sql_parts.getNumberOfUsers;


    describe("::SQLiteトライアル。", function(){
//		it("シークエンス調査");
		it.skip("実際の入出力を伴うシークエンスの調査用⇒普段はSkipさせる", function(){
            var sqlConfig = { "database" : "./db/mydb.sqlite3" }; // npm test 実行フォルダ、からの相対パス
//            sqlConfig = { "database" : "./db/test.splite3" }
             
            var queryFromGet = { "device_key" : "ほげふがぴよ" };
            var dataFromPost = null;
            var promise;
            this.timeout(5000);

            promise = createPromiseForSqlConnection( sqlConfig );

            promise = promise.then( function(result){
                return sql_parts.setupTable1st( sqlConfig.database );
            });

            promise = promise.then( function(result){
                return getNumberOfUsers( sqlConfig.database );
            });

            promise = promise.then( function(result){
                return addNewUser( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", 1024, "password" );
            });

            promise = promise.then( function(result){
                return getListOfActivityLogWhereDeviceKey( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", null );
            });

            promise = promise.then(function( result ){
                return isOwnerValid( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny" );
            }).then(function( maxCount ){
				console.log( "[maxCount]" + maxCount );
                // expect( maxCount, "記録エントリーの最大個数を返却すること" ).to.be.exist;
                return addActivityLog2Database( sqlConfig.database, "nyan1nyan2nyan3nayn4nayn5nyan6ny", 90 );
            });
            return shouldFulfilled(
                promise
			).then(function( result ){
                console.log( result );
                closeConnection( sqlConfig.database );
			});
		});
	});
});
/*
[ { type: 'table',
    name: 'activitylogs',
    tbl_name: 'activitylogs',
    rootpage: 2,
    sql: 'CREATE TABLE activitylogs([id] [integer] PRIMARY KEY AUTOINCREMENT NOT NULL, [created_at] [datetime] NOT NULL, [type] [int] NULL, [owners_hash] [char](64) NULL )' },
  { type: 'table',
    name: 'sqlite_sequence',
    tbl_name: 'sqlite_sequence',
    rootpage: 3,
    sql: 'CREATE TABLE sqlite_sequence(name,seq)' },
  { type: 'table',
    name: 'owners_permission',
    tbl_name: 'owners_permission',
    rootpage: 4,
    sql: 'CREATE TABLE owners_permission([id] [integer] PRIMARY KEY AUTOINCREMENT NOT NULL, [owners_hash] [char](64) NOT NULL, [password] [char](16) NULL, [max_entrys] [int] NOT NULL, UNIQUE ([owners_hash]))' } ]
*/
/*
[ { type: 'table',
    name: 'activitylogs',
    tbl_name: 'activitylogs',
    rootpage: 2,
    sql: 'CREATE TABLE activitylogs([id] [integer] PRIMARY KEY AUTOINCREMENT NOT NULL, [created_at] [datetime] NOT NULL, [ty
pe] [int] NULL, [owners_hash] [char](64) NULL )' },
  { type: 'table',
    name: 'sqlite_sequence',
    tbl_name: 'sqlite_sequence',
    rootpage: 3,
    sql: 'CREATE TABLE sqlite_sequence(name,seq)' },
  { type: 'table',
    name: 'owners_permission',
    tbl_name: 'owners_permission',
    rootpage: 4,
    sql: 'CREATE TABLE owners_permission([id] [integer] PRIMARY KEY AUTOINCREMENT NOT NULL, [owners_hash] [char](64) NOT NUL
L, [password] [char](16) NULL, [max_entrys] [int] NOT NULL, UNIQUE ([owners_hash]))' } ]
*/



