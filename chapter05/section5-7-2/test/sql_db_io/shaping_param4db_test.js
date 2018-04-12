/*
    [shaping_param4db_test.js]

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

const sql_parts = require("../../src/api/sql_db_io/shaping_param4db.js");




describe( "sql_lite_db_test.js", function(){
    /**
     * @type 各テストからはアクセス（ReadOnly）しない定数扱いの共通変数。
     */
    var ORIGINAL = {};
    var sqlConfig = { "database" : "だみ～.sqlite3" };
    beforeEach( function(){
        ORIGINAL[ "_isValidDateFormat" ] = sql_parts.factoryImpl._isValidDateFormat.getInstance();
    });
    afterEach( function(){
        sql_parts.factoryImpl._isValidDateFormat.setStub( ORIGINAL._isValidDateFormat );
    });
    

    describe( "::内部関数::_isValidDateFormat()", function(){
        var isValidDateFormat = sql_parts.factoryImpl._isValidDateFormat.getInstance();
        it("正常系：日付のみ指定", function(){
            var result = isValidDateFormat("2017-12-31");
            assert( result );
        })
        it("正常系：日付＋時刻を指定", function(){
            var result = isValidDateFormat("2017-12-31 08:00:23.000");
            assert( result );
        })
        it("異常系：フォーマット違反at日付", function(){
            var result = isValidDateFormat("2017/12/31"); // 区切り文字が「/」で不正。
            assert( !result );
        })
        it("異常系：フォーマット違反at時刻", function(){
            var result = isValidDateFormat("2017-12-31 08:00:23") // ミリ秒が無いケース⇒時刻の指定をするときは、ミリ秒まで必須とする。
            assert( !result );
        })
    })

    describe( "::getInsertObjectFromPostData()", function(){
        it("正常系");
    });
    describe( "::getDeleteObjectFromPostData()", function(){
        var getDeleteObjectFromPostData = sql_parts.getDeleteObjectFromPostData;

        it("正常系：期間指定せず⇒4週間より以前を削除、として扱う", function(){
            var clock = sinon.useFakeTimers(); // これで時間が止まる。「1970-01-01 09:00:00.000」に固定される。
            var spied_isValidDateFormat = sinon.spy( sql_parts.factoryImpl._isValidDateFormat.getInstance() );
            var inputGetData = {
                "device_key" : "デバイス識別キー",
                "pass_key" : "パスキー（ここでは検証しない）"
            };
            var result;
            sql_parts.factoryImpl._isValidDateFormat.setStub( spied_isValidDateFormat );

            result = getDeleteObjectFromPostData( inputGetData );

            clock.restore(); // 時間停止解除。
            expect( result ).to.not.have.property("invalid");
            expect( result ).to.have.property("device_key").to.equal(inputGetData.device_key);
            expect( result ).to.have.property("pass_key").to.equal(inputGetData.pass_key);
            expect( result ).to.not.have.property("date_start"); // ここは設定「無し」になること。
            expect( result ).to.have.property("date_end")
            .to.equal("1969-12-04"); // 「1970-01-01」の4週間前（28日前）が設定されること。

            expect( spied_isValidDateFormat.getCall(0).args[0] ).to.equal("1969-12-04");
        });
        it("正常系：日付での期間指定あり。",function(){
            var clock = sinon.useFakeTimers(); // これで時間が止まる。「1970-01-01 09:00:00.000」に固定される。
            var spied_isValidDateFormat = sinon.spy( sql_parts.factoryImpl._isValidDateFormat.getInstance() );
            var inputGetData = {
                "device_key" : "デバイス識別キー",
                "pass_key" : "パスキー（ここでは検証しない）",
                "date_start" : "2017-12-31",
                "date_end" : "2018-01-06"
            };
            var result;
            sql_parts.factoryImpl._isValidDateFormat.setStub( spied_isValidDateFormat );

            result = getDeleteObjectFromPostData( inputGetData );

            clock.restore(); // 時間停止解除。
            expect( result ).to.not.have.property("invalid");
            expect( result ).to.have.property("device_key").to.equal(inputGetData.device_key);
            expect( result ).to.have.property("pass_key").to.equal(inputGetData.pass_key);
            expect( result ).to.have.property("date_start")
            .to.equal(inputGetData.date_start); // 実際の時刻に依存せず、引数に与えたものが格納されている事。
            expect( result ).to.have.property("date_end")
            .to.equal(inputGetData.date_end);  // 上同。

            assert( spied_isValidDateFormat.withArgs( inputGetData.date_start ).calledOnce );
            assert( spied_isValidDateFormat.withArgs( inputGetData.date_end ).calledOnce );
        });
        it("異常系：期間指定のパラメータの１つめがフォーマット違反",function () {
            var stubed_isValidDateFormat = sinon.stub(); // これ自体をstubで差替えてテスト。
            var inputGetData = {
                "device_key" : "デバイス識別キー",
                "pass_key" : "パスキー（ここでは検証しない）",
                "date_start" : "ここは何かしら必要"
                // date_endプロパティの有無に寄らず、isValidDateFormat()が呼ばれることは検証済み。
                // ここでの値は省略。
            };
            var result;
            stubed_isValidDateFormat.onCall(0).returns( false );
            stubed_isValidDateFormat.onCall(1).returns( true );
            sql_parts.factoryImpl._isValidDateFormat.setStub( stubed_isValidDateFormat );
            
            result = getDeleteObjectFromPostData( inputGetData );

            expect( result ).to.have.property("invalid");
        });
        it("異常系：期間指定のパラメータの２つめがフォーマット違反",function () {
            var stubed_isValidDateFormat = sinon.stub(); // これ自体をstubで差替えてテスト。
            var inputGetData = {
                "device_key" : "デバイス識別キー",
                "pass_key" : "パスキー（ここでは検証しない）",
                "date_start" : "ここは何かしら必要"
                // date_endプロパティの有無に寄らず、isValidDateFormat()が呼ばれることは検証済み。
                // ここでの値は省略。
            };
            var result;
            stubed_isValidDateFormat.onCall(0).returns( true );
            stubed_isValidDateFormat.onCall(1).returns( false );
            sql_parts.factoryImpl._isValidDateFormat.setStub( stubed_isValidDateFormat );
            
            result = getDeleteObjectFromPostData( inputGetData );

            expect( result ).to.have.property("invalid");
        });
    });
    describe( "::getShowObjectFromGetData()",function(){
        var getShowObjectFromGetData = sql_parts.getShowObjectFromGetData;

        it("正常系：期間指定せず⇒4週間として扱う", function(){
            var clock = sinon.useFakeTimers(); // これで時間が止まる。「1970-01-01 09:00:00.000」に固定される。
            var spied_isValidDateFormat = sinon.spy( sql_parts.factoryImpl._isValidDateFormat.getInstance() );
            var inputGetData = {
                "device_key" : "デバイス識別キー",
                "pass_key" : "パスキー（ここでは検証しない）"
            };
            var result;
            sql_parts.factoryImpl._isValidDateFormat.setStub( spied_isValidDateFormat );

            result = getShowObjectFromGetData( inputGetData );

            clock.restore(); // 時間停止解除。
            expect( result ).to.not.have.property("invalid");
            expect( result ).to.have.property("device_key").to.equal(inputGetData.device_key);
            expect( result ).to.have.property("pass_key").to.equal(inputGetData.pass_key);
            expect( result ).to.have.property("date_start")
            .to.equal("1969-12-04"); // 「1970-01-01」の4週間前（28日前）が設定されること。
            expect( result ).to.have.property("date_end")
            .to.equal("1970-01-01 23:59:59.999");

            assert( spied_isValidDateFormat.withArgs("1969-12-04").calledOnce );
            assert( spied_isValidDateFormat.withArgs("1970-01-01 23:59:59.999").calledOnce );
        });
        it("正常系：日付での期間指定あり。",function(){
            var clock = sinon.useFakeTimers(); // これで時間が止まる。「1970-01-01 09:00:00.000」に固定される。
            var spied_isValidDateFormat = sinon.spy( sql_parts.factoryImpl._isValidDateFormat.getInstance() );
            var inputGetData = {
                "device_key" : "デバイス識別キー",
                "pass_key" : "パスキー（ここでは検証しない）",
                "date_start" : "2017-12-31",
                "date_end" : "2018-01-06"
            };
            var result;
            sql_parts.factoryImpl._isValidDateFormat.setStub( spied_isValidDateFormat );

            result = getShowObjectFromGetData( inputGetData );

            clock.restore(); // 時間停止解除。
            expect( result ).to.not.have.property("invalid");
            expect( result ).to.have.property("device_key").to.equal(inputGetData.device_key);
            expect( result ).to.have.property("pass_key").to.equal(inputGetData.pass_key);
            expect( result ).to.have.property("date_start")
            .to.equal(inputGetData.date_start); // 実際の時刻に依存せず、引数に与えたものが格納されている事。
            expect( result ).to.have.property("date_end")
            .to.equal(inputGetData.date_end);  // 上同。

            assert( spied_isValidDateFormat.withArgs(inputGetData.date_start).calledOnce );
            assert( spied_isValidDateFormat.withArgs(inputGetData.date_end).calledOnce );
        });
        it("異常系：期間指定のパラメータの１つめがフォーマット違反",function () {
            var stubed_isValidDateFormat = sinon.stub(); // これ自体をstubで差替えてテスト。
            var inputGetData = {
                "device_key" : "デバイス識別キー",
                "pass_key" : "パスキー（ここでは検証しない）"
                // date_start, date_endプロパティの有無に寄らず、isValidDateFormat()が呼ばれることは検証済み。
                // ここでの値は省略。
            };
            var result;
            stubed_isValidDateFormat.onCall(0).returns( false );
            stubed_isValidDateFormat.onCall(1).returns( true );
            sql_parts.factoryImpl._isValidDateFormat.setStub( stubed_isValidDateFormat );
            
            result = getShowObjectFromGetData( inputGetData );

            expect( result ).to.have.property("invalid");
        });
        it("異常系：期間指定のパラメータの２つめがフォーマット違反",function () {
            var stubed_isValidDateFormat = sinon.stub(); // これ自体をstubで差替えてテスト。
            var inputGetData = {
                "device_key" : "デバイス識別キー",
                "pass_key" : "パスキー（ここでは検証しない）"
                // date_start, date_endプロパティの有無に寄らず、isValidDateFormat()が呼ばれることは検証済み。
                // ここでの値は省略。
            };
            var result;
            stubed_isValidDateFormat.onCall(0).returns( true );
            stubed_isValidDateFormat.onCall(1).returns( false );
            sql_parts.factoryImpl._isValidDateFormat.setStub( stubed_isValidDateFormat );
            
            result = getShowObjectFromGetData( inputGetData );

            expect( result ).to.have.property("invalid");
        });
    });
});

