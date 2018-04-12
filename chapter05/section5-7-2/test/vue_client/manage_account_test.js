/*
    [vue_promise_test.js]
    encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var promiseTestHelper = require("promise-test-helper");
var shouldFulfilled = promiseTestHelper.shouldFulfilled;
var target = require("../../src/public/javascripts/manage_account.js");


describe("TEST for manage_account.js", function(){
    this.timeout( 5000 );
    var stub_fooked_axios = {};
	var original;
	beforeEach(()=>{ // フック前の関数を保持する。
		original = {
            "axios" : target.hook.axios,
        };

        target.hook.axios = stub_fooked_axios;
	});
	afterEach(()=>{ // フックした（かもしれない）関数を、元に戻す。
        // target.set.data_manager = original.data_manager;

        target.hook.axios = original.axios;
	});

    describe("::promiseCreateAccount()",function(){
        it('正常系', function(){
            var userNameStr = "識別ID";
            var passKeyStr =  "認証用のパスワード";
            var expectedData = {
                "signuped" : {
                    "device_key" : userNameStr,
                    "password" : passKeyStr
                }
            };
            var promiseCreateAccount = target.promiseCreateAccount;

            // ※「stub_fooked_axios」はbeforeEach(), afterEach() の外で定義済み＆hookに接続済み。
            stub_fooked_axios["get"] = sinon.stub();
            stub_fooked_axios["post"] = sinon.stub();

            stub_fooked_axios.post.onCall(0).returns(
                Promise.resolve({
                    "data" : expectedData
                })
            );

            return shouldFulfilled(
                promiseCreateAccount( userNameStr, passKeyStr )
            ).then(function(result){
                expect(result).to.deep.equal( expectedData );
            });
        });
    });
    describe("::promiseRemoveAccount()",function(){
        it("正常系");
    });
});



