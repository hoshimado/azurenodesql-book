/*
	[responser_ex.js]

	encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");

const responser_wrapper = require("../src/responser_wrapper.js");
function MOCK_HTTP_RESPONSE(){
    return {
        "writeHead" : (status, headers)=>{},
        "write" : (data)=>{},
        "end" : ()=>{}
    }; // ※prototype不可。
};


describe( "responser_ex.js::ResponseExtendJson()", function(){
    describe( "::writeHead()", function(){
        it(" calls original writeHead()", function(){
            var fakeResponse = new MOCK_HTTP_RESPONSE();
            var fakeWriteHead = sinon.spy( fakeResponse, "writeHead" );
            var expectedStatus = 200;
            var expectedHeaders = { head : "hoge", "Content-Type" : "application/javascript; charset=utf-8" };
            var responser = new responser_wrapper.ResponseExtendJson( fakeResponse );

            responser.writeHead( expectedStatus, expectedHeaders );

            assert( fakeWriteHead.calledOnce, "writeHead()を呼ぶ");
            expect( fakeWriteHead.getCall(0).args[0] ).to.equal( expectedStatus,
            "引数１は、ステータスコード" );
            expect( fakeWriteHead.getCall(0).args[1] ).to.deep.equal( expectedHeaders,
            "引数２は、ヘッダーmap" );
        });

        it(" calls with Optional ARGV");
    });

    describe( "::write()", function(){
        it(" calls original write()", function(){
            var fakeResponse = new MOCK_HTTP_RESPONSE();
            var fakeWrite = sinon.spy( fakeResponse, "write" );
            var expectedData = "data str";
            var responser = new responser_wrapper.ResponseExtendJson( fakeResponse );

            responser.write( expectedData );

            assert( fakeWrite.calledOnce, "write()を呼ぶ");
            expect( fakeWrite.getCall(0).args[0] ).to.equal( expectedData, 
            "引数１は、渡した文字列");
        });

        it(" calls with Optional ARGV");
    });

    describe( "::end()", function(){
        it(" calls original end()", function(){
            var fakeResponse = new MOCK_HTTP_RESPONSE();
            var fakeEnd = sinon.spy( fakeResponse, "end" );
            var responser = new responser_wrapper.ResponseExtendJson( fakeResponse );

            responser.end();

            assert( fakeEnd.calledOnce, "end()を呼ぶ");
        });

        it(" calls with Optional ARGV");
    });

    describe( "::writeJsonAsString()", function(){
        it(" calls writeHead(), write(), and end() as [JSON] after create NO get parameters.", function(){
            var fakeRes = new MOCK_HTTP_RESPONSE();
            var fakeWriteHead = sinon.spy( fakeRes, "writeHead" );
            var fakeWrite = sinon.spy( fakeRes, "write" );
            var fakeEnd = sinon.spy( fakeRes, "end" );
            var responser = new responser_wrapper.ResponseExtendJson( fakeRes );
            var expectedData = { a : "hoge", b: "fuga" };

            responser.writeJsonAsString( expectedData );

            assert( fakeWriteHead.calledOnce, "writeHead()を呼ぶ");
            expect( fakeWriteHead.getCall(0).args[0]).to.equal( 200 ); // 200=OK
            expect( fakeWriteHead.getCall(0).args[1]).to.deep.equal({
                "Access-Control-Allow-Origin" : "*", // クロスドメインを許可
                "Pragma" : "no-cacha", 
                "Cache-Control" : "no-cache",
                "Content-Type" : "application/json; charset=utf-8"
            });

            assert( fakeWrite.calledOnce, "write()を呼ぶ")
            expect( fakeWrite.getCall(0).args[0] ).to.equal( 
                JSON.stringify(expectedData)
            );

            assert( fakeEnd.calledOnce, "end()を呼ぶ");
        });
        
        it(" calls writeHead(), write(), and end() as [JSON] after create with get parameters but [No callback].", function(){
            var fakeRes = new MOCK_HTTP_RESPONSE();
            var fakeWriteHead = sinon.spy( fakeRes, "writeHead" );
            var fakeWrite = sinon.spy( fakeRes, "write" );
            var fakeEnd = sinon.spy( fakeRes, "end" );
            var responser = new responser_wrapper.ResponseExtendJson( fakeRes, { 
                "hoge" : "dummy"
            });
            var expectedData = { a : "hoge", b: "fuga" };

            responser.writeJsonAsString( expectedData );

            assert( fakeWriteHead.calledOnce, "writeHead()を呼ぶ");
            expect( fakeWriteHead.getCall(0).args[0]).to.equal( 200 ); // 200=OK
            expect( fakeWriteHead.getCall(0).args[1]).to.deep.equal({
                "Access-Control-Allow-Origin" : "*", // クロスドメインを許可
                "Pragma" : "no-cacha", 
                "Cache-Control" : "no-cache",
                "Content-Type" : "application/json; charset=utf-8"
            });

            assert( fakeWrite.calledOnce, "write()を呼ぶ")
            expect( fakeWrite.getCall(0).args[0] ).to.equal( 
                JSON.stringify(expectedData)
            );

            assert( fakeEnd.calledOnce, "end()を呼ぶ");
        });

        
        it(" calls writeHead(), write(), and end() as JSON[P] after create with get parameters[callback].", function(){
            var fakeRes = new MOCK_HTTP_RESPONSE();
            var fakeWriteHead = sinon.spy( fakeRes, "writeHead" );
            var fakeWrite = sinon.spy( fakeRes, "write" );
            var fakeEnd = sinon.spy( fakeRes, "end" );
            var callbackName = "jsonpfuncname";
            var responser = new responser_wrapper.ResponseExtendJson( fakeRes, { 
                "callback": callbackName,
                "hoge" : "dummy"
            });
            var expectedData = { a : "hoge", b: "fuga" };

            responser.writeJsonAsString( expectedData );

            assert( fakeWriteHead.calledOnce, "writeHead()を呼ぶ");
            expect( fakeWriteHead.getCall(0).args[0]).to.equal( 200 ); // 200=OK
            expect( fakeWriteHead.getCall(0).args[1]).to.deep.equal({
                "Pragma" : "no-cacha", 
                "Cache-Control" : "no-cache",
                "Content-Type" : "application/javascript; charset=utf-8"
            });

            assert( fakeWrite.calledOnce, "write()を呼ぶ")
            expect( fakeWrite.getCall(0).args[0] ).to.equal( 
                callbackName + "(" + JSON.stringify(expectedData) + ")"
            );

            assert( fakeEnd.calledOnce, "end()を呼ぶ");
        });

        it(" calls writeHead() with 500",function(){
            var fakeRes = new MOCK_HTTP_RESPONSE();
            var fakeWriteHead = sinon.spy( fakeRes, "writeHead" );
            var fakeWrite = sinon.spy( fakeRes, "write" );
            var fakeEnd = sinon.spy( fakeRes, "end" );
            var responser = new responser_wrapper.ResponseExtendJson( fakeRes );
            var expectedData = { a : "hoge", b: "fuga" };

            responser.writeJsonAsString( expectedData, 500 );

            assert( fakeWriteHead.calledOnce, "writeHead()を呼ぶ");
            expect( fakeWriteHead.getCall(0).args[0]).to.equal( 500 ); // 500=Error
            expect( fakeWriteHead.getCall(0).args[1]).to.deep.equal({
                "Access-Control-Allow-Origin" : "*", // クロスドメインを許可
                "Pragma" : "no-cacha", 
                "Cache-Control" : "no-cache",
                "Content-Type" : "application/json; charset=utf-8"
            });

            assert( fakeWrite.calledOnce, "write()を呼ぶ")
            expect( fakeWrite.getCall(0).args[0] ).to.equal( 
                JSON.stringify(expectedData)
            );

            assert( fakeEnd.calledOnce, "end()を呼ぶ");
            
        });
    });
});







