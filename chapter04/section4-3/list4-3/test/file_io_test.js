/*
    [file_io_test.js]
	encoding=utf-8
*/


var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;

var file = require("../src/file_io.js");


describe( "file_io.js", function(){
    describe( "::loadConfigFile()",function(){
        var loadConfigFile = file.loadConfigFile;
        var original, stubs;
        beforeEach(function(){
            original = {
                "io" : file.factoryImpl.io.getInstance(),
                "parts" : file.factoryImpl.parts.getInstance(),
                "alert" : file.factoryImpl.dialog.getInstance()
            };

            stubs = {
                "io" : {
                    "loadTextFile" : sinon.stub()
                },
                "parts" : {
                    "parseBatteryLogAzureParam6Text" : sinon.stub(),
                    "setAndInsert2Vue" : sinon.stub()
                },
                "dialog" : {
                    "alert" : sinon.stub()
                }
            };
            file.factoryImpl.io.setStub(stubs.io);
            file.factoryImpl.parts.setStub(stubs.parts);
            file.factoryImpl.dialog.setStub(stubs.dialog);
        });
        afterEach(function(){
            file.factoryImpl.io.setStub(original.io);
            file.factoryImpl.parts.setStub(original.parts);
            file.factoryImpl.dialog.setStub(original.dialog);
        });

        it("読込みファイルのフォーマットは適切⇒解析してVueへ設定",function(){
            var fake_vue = {
                "add_device" : sinon.stub()
            };
            var IN_EVENT = {};
            var EX_TEXT = "読込まれたテキスト";
            var EX_PARAM = {};

            stubs.io.loadTextFile.onCall(0).returns(Promise.resolve(EX_TEXT));
            stubs.parts.parseBatteryLogAzureParam6Text.onCall(0).returns(EX_PARAM);
            stubs.parts.setAndInsert2Vue.onCall(0).returns(true);
            return shouldFulfilled( loadConfigFile( fake_vue, IN_EVENT ) ).then(function(){
                assert(stubs.io.loadTextFile.calledOnce);
                expect(stubs.io.loadTextFile.getCall(0).args[0]).to.equal(IN_EVENT);

                assert(stubs.parts.parseBatteryLogAzureParam6Text.calledOnce);
                expect(stubs.parts.parseBatteryLogAzureParam6Text.getCall(0).args[0]).to.equal(EX_TEXT);

                assert(stubs.parts.setAndInsert2Vue.calledWith(fake_vue,EX_PARAM));

                assert(fake_vue.add_device.calledOnce, "読み込み成功時は、vue::add_device()を呼ぶこと");

                assert(!stubs.dialog.alert.calledOnce, "dialog::alert()が呼ばれないこと");
            });
        });
        it("読込みファイルが不正");
    });


    describe( "::parseBatteryLogAzureParam6Text()",function(){
        var parseBatteryLogAzureParam6Text = file.factoryImpl.parts.getInstance().parseBatteryLogAzureParam6Text;
        var original, stubs;
        beforeEach(function(){
        });
        afterEach(function(){
        });

        it("CRLF区切りの場合",function(){
            var srcText;
            var IN_AZURE = "http://固定にするか、これ？.azurewebsites.net";
            var IN_MAC = "リモートでは利用しないけどローカルで使うのだMACアドレスは";
            var IN_KEY = "デバイスキー";
            var IN_NAME = "デバイスの名称";
            var IN_EOS = "\r\n";
            var param;
            
            srcText = "[BatteryAzure]" + IN_EOS;
            srcText += "Encoding=UTF8" + IN_EOS;
            srcText += "Version=20170514" + IN_EOS;
            srcText += "AzureDomain=" + IN_AZURE + IN_EOS;
            srcText += "MacAddress=" + IN_MAC + IN_EOS;
            srcText += "DeviceKey=" + IN_KEY + IN_EOS;
            srcText += "DeviceName=" + IN_NAME + IN_EOS;

            param = parseBatteryLogAzureParam6Text( srcText );
            expect(param).to.have.property("azure_domain").and.equal(IN_AZURE);
            expect(param).to.have.property("device_key").and.equal(IN_KEY);
            expect(param).to.have.property("device_name").and.equal(IN_NAME);
        });

        it("LF区切りの場合",function(){
            var srcText;
            var IN_AZURE = "http://固定にするか、これ？.azurewebsites.net";
            var IN_MAC = "リモートでは利用しないけどローカルで使うのだMACアドレスは";
            var IN_KEY = "デバイスキー";
            var IN_NAME = "デバイスの名称";
            var IN_EOS = "\n";
            var param;
            
            srcText = "[BatteryAzure]" + IN_EOS;
            srcText += "Encoding=UTF8" + IN_EOS;
            srcText += "Version=20170514" + IN_EOS;
            srcText += "AzureDomain=" + IN_AZURE + IN_EOS;
            srcText += "MacAddress=" + IN_MAC + IN_EOS;
            srcText += "DeviceKey=" + IN_KEY + IN_EOS;
            srcText += "DeviceName=" + IN_NAME + IN_EOS;

            param = parseBatteryLogAzureParam6Text( srcText );
            expect(param).to.have.property("azure_domain").and.equal(IN_AZURE);
            expect(param).to.have.property("device_key").and.equal(IN_KEY);
            expect(param).to.have.property("device_name").and.equal(IN_NAME);
        });

        it("バージョンが期待値と異なる⇒null返却",function(){
            var srcText;
            var IN_AZURE = "http://固定にするか、これ？.azurewebsites.net";
            var IN_MAC = "リモートでは利用しないけどローカルで使うのだMACアドレスは";
            var IN_KEY = "デバイスキー";
            var IN_NAME = "デバイスの名称";
            var IN_EOS = "\n";
            var param;
            
            srcText = "[BatteryAzure]" + IN_EOS;
            srcText += "Encoding=UTF8" + IN_EOS;
            srcText += "Version=20170513" + IN_EOS;
            srcText += "AzureDomain=" + IN_AZURE + IN_EOS;
            srcText += "MacAddress=" + IN_MAC + IN_EOS;
            srcText += "DeviceKey=" + IN_KEY + IN_EOS;
            srcText += "DeviceName=" + IN_NAME + IN_EOS;

            param = parseBatteryLogAzureParam6Text( srcText );
            assert(!param, "戻り値がnullであること");
        });

        it("期待したkey x3へのパースが出来ない⇒null返却",function(){
            var srcText;
            var IN_AZURE = "http://固定にするか、これ？.azurewebsites.net";
            var IN_MAC = "リモートでは利用しないけどローカルで使うのだMACアドレスは";
            var IN_KEY = "デバイスキー";
            var IN_NAME = "デバイスの名称";
            var IN_EOS = "\n";
            var param;
            
            srcText = "[BatteryAzure]" + IN_EOS;
            srcText += "Encoding=UTF8" + IN_EOS;
            srcText += "Version=20170514" + IN_EOS;
            srcText += "MacAddress=" + IN_MAC + IN_EOS;
            srcText += "DeviceKey=" + IN_KEY + IN_EOS;
            srcText += "DeviceName=" + IN_NAME + IN_EOS;

            param = parseBatteryLogAzureParam6Text( srcText );
            assert(!param, "Azureキー無し⇒戻り値がnullであること");

            srcText = "[BatteryAzure]" + IN_EOS;
            srcText += "Encoding=UTF8" + IN_EOS;
            srcText += "Version=20170514" + IN_EOS;
            srcText += "AzureDomain=" + IN_AZURE + IN_EOS;
            srcText += "MacAddress=" + IN_MAC + IN_EOS;
            srcText += "DeviceName=" + IN_NAME + IN_EOS;

            param = parseBatteryLogAzureParam6Text( srcText );
            assert(!param, "デバイスキー無し⇒戻り値がnullであること");

            srcText = "[BatteryAzure]" + IN_EOS;
            srcText += "Encoding=UTF8" + IN_EOS;
            srcText += "Version=20170514" + IN_EOS;
            srcText += "AzureDomain=" + IN_AZURE + IN_EOS;
            srcText += "MacAddress=" + IN_MAC + IN_EOS;
            srcText += "DeviceKey=" + IN_KEY + IN_EOS;

            param = parseBatteryLogAzureParam6Text( srcText );
            assert(!param, "デバイス名無し⇒戻り値がnullであること");
        });
    });


    describe( "::setAndInsert2Vue()",function(){
        var setAndInsert2Vue = file.factoryImpl.parts.getInstance().setAndInsert2Vue;
        var original, stubs;
        beforeEach(function(){
        });
        afterEach(function(){
        });

        it("Vueへの設定",function(){
            var IN_AZURE = "http://固定にするか、これ？.azurewebsites.net";
            var IN_KEY = "デバイスキー";
            var IN_NAME = "デバイスの名称";
            var vue_fake = {
                        "azure_domain_str" : "",
                        "device_key_str"   : "",
                        "device_name_str"  : ""
            };
            var param = {
                "azure_domain" : IN_AZURE,
                "device_key" : IN_KEY,
                "device_name" : IN_NAME
            };

            assert( setAndInsert2Vue( vue_fake, param ) );

            expect(vue_fake.azure_domain_str).to.equal(IN_AZURE);
            expect(vue_fake.device_key_str).to.equal(IN_KEY);
            expect(vue_fake.device_name_str).to.equal(IN_NAME);
        });

        it("入力が null / undefined 時は false を返却する",function(){
            var IN_AZURE = "http://固定にするか、これ？.azurewebsites.net";
            var IN_KEY = "デバイスキー";
            var IN_NAME = "デバイスの名称";
            var vue_fake = {
                        "azure_domain_str" : "",
                        "device_key_str"   : "",
                        "device_name_str"  : ""
            };
            var param = {
                "azure_domain" : IN_AZURE,
                "device_key" : IN_KEY,
                "device_name" : IN_NAME
            };

            assert( !setAndInsert2Vue( vue_fake, null ) );
        });
    });
});

