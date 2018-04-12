/*
    [vue_promise_test.js]
    encoding=utf-8
*/

var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var promiseTestHelper = require("promise-test-helper");
var shouldFulfilled = promiseTestHelper.shouldFulfilled;
var target = require("../../src/public/javascripts/vue_simple.js");


describe("TEST for vue_simple.js", function(){
    var stub_vue;
	beforeEach(()=>{
        // 各テスト毎に実行する前処理。
        stub_vue = sinon.stub();
	});
	afterEach(()=>{
        // 各テスト毎に実行する後処理。
	});

    describe("vueApp()",function(){
        it('::construct', function(){
            var vueApp = target.vueApp( stub_vue );
            var called_options = stub_vue.getCall(0).args[0];

            expect( called_options ).to.be.exist;
            expect( called_options.el ).to.equal( "#app" );
            expect( called_options.data ).to.deep.equal({
                "message" : "Hello Vue!"
            });

        });
        it("::reverseMessage()", function(){
            var vueApp = target.vueApp( stub_vue );
            var called_options = stub_vue.getCall(0).args[0];

            expect( called_options.methods.reverseMessage ).to.be.exist;
            var reverseMessage = called_options.methods.reverseMessage;
            var stub_instance = {"message" : "Hello!"};
            reverseMessage.apply( stub_instance );
            expect( stub_instance.message ).to.equal("!olleH");
        });
    });
});



