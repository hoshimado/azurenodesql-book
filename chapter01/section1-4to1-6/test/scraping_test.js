/**
 * [scraping_test.js]
 * encoding=utf-8
 */


var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;

var target = require("../src/scraping.js");

var fs = require("fs");

describe( "scraping.js", function(){
    var original;
    /**
     * @type テスト毎に前処理する。
     */
    beforeEach(function(){
        original = {
            "fs" : target.api_impl.fs,
            "isCacheUse;" : target.api_impl.isCacheUse,
            "fetchAndWriteCacheOnCherrioHttpCli" : target.api_impl.fetchAndWriteCacheOnCherrioHttpCli,
            "readCacheHtmlAndParseToEventArray" : target.api_impl.readCacheHtmlAndParseToEventArray
        };
    });
    /**
     * @type テスト毎に後処理する。
     */
    afterEach(function(){
        target.api_impl.fs = original.fs;
        target.api_impl.readCacheHtmlAndParseToEventArray = original.readCacheHtmlAndParseToEventArray;
    });

    describe("::fetchAndWriteCacheOnCherrioHttpCli()",function() {
       var fetchAndWriteCacheOnCherrioHttpCli = target.api_impl.fetchAndWriteCacheOnCherrioHttpCli;
       
       it("スクレイピングして、そのhtml全体をキャッシュに保存する（更新する）");
       it("スクレイピング（取得）に失敗した場合");
    });

    describe("::readCacheHtmlAndParseToEventArray()",function () {
        var readCacheHtmlAndParseToEventArray = target.api_impl.readCacheHtmlAndParseToEventArray;

        it("キャッシュからの読み込み、期待した値（日付の配列）を抽出すること", function(){
            var promiseStubData = new Promise(function(resolve) {
                fs.readFile( "./test/stub_cache.html", "utf-8", function(err, data) {
                    // npmの実行ルート＝testフォルダの上からの相対パスに成ることに注意。
                    resolve(data);
                })
            });
            return promiseStubData.then(function(stubData) {
                var stub_fs = {
                    "readFile" : sinon.stub()
                };
                stub_fs.readFile.callsArgWith(2, /* err= */null, /* data= */stubData);
                target.api_impl.fs = stub_fs;
                
                return shouldFulfilled(
                    readCacheHtmlAndParseToEventArray()
                ).then(function(result){
                    assert(result);
                    expect(result).has.property("httpStatus").to.be.equal(200);
                    expect(result).has.property("data");
    
                    var data = result.data;
                    var EXPECTED_EVANT_ARRAY = [
                        { "start" : "2018-02-25" },
                        { "start" : "2018-02-21" },
                        { "start" : "2018-02-11" },
                        { "start" : "2018-02-08" },
                        { "start" : "2018-02-04" },
                        { "start" : "2018-02-04" },
                        { "start" : "2018-02-13" },
                        { "start" : "2018-02-13" },
                        { "start" : "2018-02-24" },
                        { "start" : "2018-02-10" },
                        { "start" : "2018-02-08" },
                        { "start" : "2018-02-13" },
                        { "start" : "2018-02-14" },
                        { "start" : "2018-02-24" },
                        { "start" : "2018-02-06" },
                        { "start" : "2018-02-12" },
                        { "start" : "2018-02-25" },
                        { "start" : "2018-02-25" },
                        { "start" : "2018-02-23" }
                    ];
                    var i=0, n = EXPECTED_EVANT_ARRAY.length;
                    while(i<n){
                        assert( data[i], "配列要素[" + i + "]が存在すること" );
                        expect( data[i].date ).to.be.equal(EXPECTED_EVANT_ARRAY[i].date);
                        i++;
                    }
                });
            });
        });

        it("キャッシュからの読み込みに失敗した場合の応答", function(){
            var stub_fs = {
                "readFile" : sinon.stub()
            };
            stub_fs.readFile.callsArgWith(2, /* err= */{"read":"errer"}, /* data= */null);
            target.api_impl.fs = stub_fs;
            
            return shouldRejected(
                readCacheHtmlAndParseToEventArray()
            ).then(function(result){
                assert(result);
                // expect(result).has.property("httpStatus").to.be.equal(200);
            });
        });

    });

    describe("::getEventFromTwitter()", function() {
        var getEventFromTwitter = target.getEventFromTwitter;

        // ここからテスト。
        it("キャッシュが有効期間内なら、スクレイピングはスキップしてキャッシュから読み込む", function(){
            var stubs = {
                "isCacheUse" : sinon.stub(),
                "fetchAndWriteCacheOnCherrioHttpCli" : sinon.stub(),
                "readCacheHtmlAndParseToEventArray" : sinon.stub()
            };
            var EXPECTED_RESULT = {
                "httpStatus" : 200,
                "data" : []
            };
            stubs.isCacheUse.onCall(0).returns( Promise.resolve() );
            stubs.readCacheHtmlAndParseToEventArray.onCall(0).returns( EXPECTED_RESULT );

            target.api_impl.isCacheUse = stubs.isCacheUse;
            target.api_impl.fetchAndWriteCacheOnCherrioHttpCli = stubs.fetchAndWriteCacheOnCherrioHttpCli;
            target.api_impl.readCacheHtmlAndParseToEventArray = stubs.readCacheHtmlAndParseToEventArray;

            return shouldFulfilled(
                getEventFromTwitter()
            ).then(function( result ){
                assert( stubs.isCacheUse.calledOnce );
                expect( stubs.fetchAndWriteCacheOnCherrioHttpCli.callCount, 0 );
                assert( stubs.readCacheHtmlAndParseToEventArray.calledOnce );
                expect( result ).to.deep.equal( EXPECTED_RESULT );
            });
        });
        it("キャッシュが有効期間切れなら、キャッシュを更新してから読み込む。");
    });
});


