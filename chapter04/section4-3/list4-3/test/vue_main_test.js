/*
    [vue_main_test.js]
	encoding=utf-8
*/



var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
// var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
// var shouldRejected  = require("promise-test-helper").shouldRejected;

var main = require("../src/vue_main.js");


describe( "vue_main.js", function(){
    describe( "::setupOnload()",function(){
        var setupOnload = main.setupOnLoad;
        var original, stubs;
        beforeEach(function(){
            original = {
                "build" : main.factoryImpl.build.getInstance()
            };
            stubs = {
                "build" : {
                    "setupValueAndConfigChartAction" : sinon.stub(),
                    "setupOptionSettings" : sinon.stub()
                }
            }
            main.factoryImpl.build.setStub( stubs.build );
        });
        afterEach(function(){
            main.factoryImpl.build.setStub( original.build );
        });

        it("環境構築",function(){
            var EX_VUE1 = {}, EX_VUE2 = {};
            assert(!stubs.build.setupValueAndConfigChartAction.called);
            assert(!stubs.build.setupOptionSettings.called);

            stubs.build.setupValueAndConfigChartAction.onCall(0).returns({
                "vueKeyManager" : EX_VUE1,
                "vueSelector" : EX_VUE2
            });

            setupOnload();
            expect(stubs.build.setupOptionSettings.called);
            expect(stubs.build.setupOptionSettings.getCall(0).args[0]).to.equal(EX_VUE1);

        });
    });


    describe( "::setupOptionSettings",function(){
        var setupOptionSettings = main.factoryImpl.build.getInstance().setupOptionSettings;
        var original, stubs;
        beforeEach(function(){
            original = {
                "createVue" : main.factoryImpl.createVue.getInstance(),
                "cookieData" : main.factoryImpl.cookieData.getInstance()
            };

            stubs = {
                "createVue" : sinon.stub(),
                "cookieData" : {
                    "loadItems" : sinon.stub(),
                    "saveItems" : sinon.stub(),
                    "loadLastValue" : sinon.stub(),
                    "saveLastValue" : sinon.stub(),
                    "loadAzureDomain" : sinon.stub(),
                    "saveAzureDomain" : sinon.stub()
                }
            };
            main.factoryImpl.createVue.setStub(stubs.createVue);
            main.factoryImpl.cookieData.setStub(stubs.cookieData);
        });
        afterEach(function(){
            main.factoryImpl.createVue.setStub( original.createVue );
            main.factoryImpl.cookieData.setStub( original.cookieData );
        });

        it("オプション設定のVueインスタンス構築", function(){
            var INPUT_VUE_KEYMANAGER = {
                "azure_domain_str" : null,
                "device_key_str" : null,
                "device_name_str" : null
            };

            setupOptionSettings( INPUT_VUE_KEYMANAGER );

            var app1 = stubs.createVue.getCall(0).args[0];
            expect(app1).to.have.property("computed");
            expect(app1.computed).to.have.property("is_keys_exist");

            // expect(app1.methods).to.have.property("clear_setting");

        });
        it("computed属性::is_keys_exist()", function(){
            var INPUT_VUE_KEYMANAGER = {
                "azure_domain_str" : null,
                "device_key_str" : null,
                "device_name_str" : null
            };

            setupOptionSettings( INPUT_VUE_KEYMANAGER );

            var app1 = stubs.createVue.getCall(0).args[0];
            var result = app1.computed.is_keys_exist.apply(INPUT_VUE_KEYMANAGER);
            expect(result).to.not.equal(true);

        });
    });


    describe( "::setupValueAndConfigChartAction()",function(){
        var setupValueAndConfigChartAction = main.factoryImpl.build.getInstance().setupValueAndConfigChartAction;
        var original, stubs;
        beforeEach(function(){
            original = {
                "createVue" : main.factoryImpl.createVue.getInstance(),
                "cookieData" : main.factoryImpl.cookieData.getInstance(),
                "file" : main.factoryImpl.file.getInstance(),
                "action" : main.factoryImpl.action.getInstance(),
            };

            stubs = {
                "createVue" : sinon.stub(),
                "cookieData" : {
                    "loadItems" : sinon.stub(),
                    "saveItems" : sinon.stub(),
                    "loadLastValue" : sinon.stub(),
                    "saveLastValue" : sinon.stub(),
                    "loadAzureDomain" : sinon.stub(),
                    "saveAzureDomain" : sinon.stub()
                },
                "file" : {
                    "loadConfigFile" : sinon.stub()
                },
                "action" : {
                    "addSelecterIfUnique" : sinon.stub(),
                    "showItemOnInputer" : sinon.stub(),
                    "updateLogViewer" : sinon.stub(),
                    "updateChart" : sinon.stub()
                    // var updateChart = function( RESULT_SELECTOR, azure_domain, device_key ){}
                }
            };
            main.factoryImpl.createVue.setStub(stubs.createVue);
            main.factoryImpl.cookieData.setStub(stubs.cookieData);
            main.factoryImpl.file.setStub(stubs.file);
            main.factoryImpl.action.setStub(stubs.action);
        });
        afterEach(function(){
            main.factoryImpl.createVue.setStub( original.createVue );
            main.factoryImpl.cookieData.setStub( original.cookieData );
            main.factoryImpl.file.setStub( original.file );
            main.factoryImpl.action.setStub( original.action );
        });

        it("インスタンスx2構築 - lastValueあり",function(){
            var EX_AZURE_DOMAIN = "AzD";
            var EX_VUE1 = {"azure_domain_str" : EX_AZURE_DOMAIN };
            var EX_VUE2 = {"options": [] };
            var EX_ITEMS = [{"text":"1つめテキスト", "value":"1つ目の値"}];
            var EX_LAST_VALUE = "last_value___";

            stubs.createVue.onCall(0).returns(EX_VUE1);
            stubs.createVue.onCall(1).returns(EX_VUE2);
            stubs.cookieData.loadAzureDomain.onCall(0).returns(EX_AZURE_DOMAIN);
            stubs.cookieData.loadItems.onCall(0).returns(EX_ITEMS);
            stubs.cookieData.loadLastValue.onCall(0).returns(EX_LAST_VALUE);

            // 実行。以下、変数宣言位置は無視。
            var result = setupValueAndConfigChartAction();
            expect(result).to.have.property("vueKeyManager").and.equal(EX_VUE1);
            expect(result).to.have.property("vueSelector").and.equal(EX_VUE2);

            // 以下、検証。
            assert( stubs.createVue.calledTwice, "crateVueは2回呼ばれること" );

            var app1 = stubs.createVue.getCall(0).args[0]; // 【FixMe】初回である必要はない。
            expect(app1).to.have.property("el").and.equal("#app");

            expect(app1).to.have.property("data");
            var app1_data = app1.data();
            expect(app1_data).to.have.property("azure_domain_str").and.equal(EX_AZURE_DOMAIN);
            expect(app1_data).to.have.property("device_key_str").and.equal("");
            expect(app1_data).to.have.property("device_name_str").and.equal("");

            expect(app1).to.have.property("methods");

            expect(app1.methods).to.have.property("add_azure");
            assert(!stubs.cookieData.saveAzureDomain.called, "インスタンス構築時点はsaveAzureDomein()は呼ばれない事。");
            app1.methods.add_azure.apply(app1_data,[]);
            assert(stubs.cookieData.saveAzureDomain.calledWith(EX_AZURE_DOMAIN));
            stubs.cookieData.saveAzureDomain.reset();

            expect(app1.methods).to.have.property("add_device");
            assert(!stubs.action.addSelecterIfUnique.called, "インスタンス構築時点ではaddSelecterIfUnique()は呼ばれない事");
            assert(!stubs.cookieData.saveItems.called);
            app1.methods.add_device.apply(app1);
            assert(stubs.action.addSelecterIfUnique.calledWith(app1, EX_VUE2));
            assert(stubs.cookieData.saveItems.calledWith(EX_VUE2.options));
            stubs.action.addSelecterIfUnique.reset();
            stubs.cookieData.saveItems.reset();

            expect(app1.methods).to.have.property("upload_device");
            var EX_FILE_CONFIG ={};
            stubs.file.loadConfigFile.onCall().returns(EX_FILE_CONFIG);
            app1.methods.upload_device.apply(app1, ["イベント"]);
            assert(stubs.file.loadConfigFile.calledOnce);
            expect(stubs.file.loadConfigFile.getCall(0).args[0]).to.equal(app1);
            expect(stubs.file.loadConfigFile.getCall(0).args[1]).to.equal("イベント");



            var app2 = stubs.createVue.getCall(1).args[0]; // 【FixMe】2回目である必要はない。
            expect(app2).to.have.property("el").and.equal("#app_selector");

            expect(app2).to.have.property("data");
            var app2_data = app2.data();
            expect(app2_data).to.have.property("app_version_str");
            expect(app2_data).to.have.property("selected").and.equal(EX_LAST_VALUE);
            expect(app2_data).to.have.property("options").and.equal(EX_ITEMS);

            assert(stubs.action.showItemOnInputer.calledWith(EX_VUE2, EX_VUE1));

            expect(app2).to.have.property("methods");
            expect(app2.methods).to.have.property("update_inputer");
            assert(stubs.action.showItemOnInputer.neverCalledWith(app2_data, EX_VUE1), "インスタンス構築時点ではshowItemOnInputer()は、app2,app1の組み合わせの引数では呼ばれない事"); // 別の引数組み合わせで１ど呼ばれるので注意。
            app2.methods.update_inputer.apply(app2_data,[]);
            assert(stubs.action.showItemOnInputer.calledWith(app2_data, EX_VUE1));
            stubs.action.showItemOnInputer.reset();

            expect(app2.methods).to.have.property("update_chart");
            assert(!stubs.action.updateLogViewer.called, "インスタンス構築時点ではupdateLogViewer()は呼ばれない事");
            app2.methods.update_chart.apply(EX_VUE2,[]);
            assert(stubs.cookieData.saveAzureDomain.calledWith(EX_VUE1.azure_domain_str), "saveAzureDomain()が呼ばれること");
            assert(stubs.cookieData.saveItems.calledWith(EX_VUE2.options), "saveItems()が呼ばれること");
            assert(stubs.action.updateLogViewer.calledWith(EX_VUE1));

        });

        it("インスタンスx2構築 - lastValue無し",function(){
            var EX_AZURE_DOMAIN = "AzD";
            var EX_VUE1 = {}, EX_VUE2 = {"options": [] };
            var EX_ITEMS = [{"text":"1つめテキスト", "value":"1つ目の値"}];

            stubs.createVue.onCall(0).returns(EX_VUE1);
            stubs.createVue.onCall(1).returns(EX_VUE2);
            stubs.cookieData.loadAzureDomain.onCall(0).returns(EX_AZURE_DOMAIN);
            stubs.cookieData.loadItems.onCall(0).returns(EX_ITEMS);
            stubs.cookieData.loadLastValue.onCall(0).returns(null);

            setupValueAndConfigChartAction();

            // 以下、検証。変数宣言位置は無視。
            assert( stubs.createVue.calledTwice, "crateVueは2回呼ばれること" );

            var app2 = stubs.createVue.getCall(1).args[0]; // 【FixMe】2回目である必要はない。
            expect(app2).to.have.property("el").and.equal("#app_selector");
            // 他のテストは重複なので省略。
            var app2_data = app2.data();
            expect(app2_data).to.have.property("selected").and.equal(""); // 【ToDo】無い場合のテストも必要。
            expect(app2_data).to.have.property("options").and.equal(EX_ITEMS);

            assert(!stubs.action.showItemOnInputer.called); // このケースでは「呼ばれ無い」。
        });
    });

    describe( "::_updateLogViewer()",function(){
        var updateLogViewer = main.factoryImpl.action.getInstance().updateLogViewer;
        var original;
        beforeEach(function(){
            original = {
                "cookieData" : main.factoryImpl.cookieData.getInstance(),
                "action" : main.factoryImpl.action.getInstance()
            };
        });
        afterEach(function(){
            main.factoryImpl.cookieData.setStub( original.cookieData );
            main.factoryImpl.action.setStub( original.action );
        });

        it("jQuery側のupdateChart()を呼び出して、選択デバイスはCookieに保存する",function(){
            var EX_AZURE_DOMAIN = "AzD";
            var EX_DEVICE_KEY = "device_key___";

            var stub = {
                "cookieData" : {
                    "saveLastValue" : sinon.stub(),
                },
                "action" : {
                    "updateChart" : sinon.stub()
                }
            };
            main.factoryImpl.cookieData.setStub(stub.cookieData);
            main.factoryImpl.action.setStub(stub.action);

            updateLogViewer({//src
                "azure_domain_str" : EX_AZURE_DOMAIN,
                "device_key_str" : EX_DEVICE_KEY
            });

            // 以下、検証。変数宣言位置は無視。
            assert(stub.action.updateChart.calledOnce);
            // var updateChart = function( RESULT_SELECTOR, azure_domain, device_key ){}
            expect(stub.action.updateChart.getCall(0).args[0]).to.equal("#id_result");
            expect(stub.action.updateChart.getCall(0).args[1]).to.equal(EX_AZURE_DOMAIN);
            expect(stub.action.updateChart.getCall(0).args[2]).to.equal(EX_DEVICE_KEY);

            assert(stub.cookieData.saveLastValue.calledOnce);
            expect(stub.cookieData.saveLastValue.getCall(0).args[0]).to.equal(EX_DEVICE_KEY);
        });
    });


    describe( "::_addSelecterIfUnique()",function(){
        var addSelecterIfUnique = main.factoryImpl.action.getInstance().addSelecterIfUnique;
        var original;
        beforeEach(function(){
        });
        afterEach(function(){
        });

        it("新規挿入",function(){
            var src = {
                "device_key_str" : "fugafuga",
                "device_name_str" : "新規名称"
            };
            var dest = {
                "options" :
                [
                    {"value" : "hoge",     "text": "ほげ"},
                    {"value" : "fuga",     "text": "フガ"},
                    {"value" : "piyo",     "text": "ぴよ"}
                ],
                "selected" : "piyo"
            };
            var base_array = [].concat( dest.options );

            addSelecterIfUnique( src, dest );

            // 以下、検証。
            expect(dest.options).to.include({"value":src.device_key_str, "text":src.device_name_str});
            expect(dest.selected).to.equal(src.device_key_str);
        });
        it("既存なので変化しない",function(){
            var src = {
                "device_key_str" : "fugafuga",
                "device_name_str" : "新規名称"
            };
            var dest = {
                "options" :
                [
                    {"value" : "hoge",     "text": "ほげ"},
                    {"value" : "fuga",     "text": "フガ"},
                    {"value" : "fugafuga", "text": "ふがふが"},
                    {"value" : "piyo",     "text": "ぴよ"}
                ]
            };
            var base_array = [].concat( dest.options ); // シャローコピー

            addSelecterIfUnique( src, dest );
            expect(dest.options).to.deep.equal(base_array, "真ん中に既存");


            dest = {
                "options" :
                [
                    {"value" : "fugafuga", "text": "ふがふが"},
                    {"value" : "hoge",     "text": "ほげ"},
                    {"value" : "fuga",     "text": "フガ"},
                    {"value" : "piyo",     "text": "ぴよ"}
                ]
            };
            base_array = [].concat( dest.options );
            addSelecterIfUnique( src, dest );
            expect(dest.options).to.deep.equal(base_array, "先頭に既存");


            dest = {
                "options" :
                [
                    {"value" : "hoge",     "text": "ほげ"},
                    {"value" : "fuga",     "text": "フガ"},
                    {"value" : "piyo",     "text": "ぴよ"},
                    {"value" : "fugafuga", "text": "ふがふが"}
                ]
            };
            base_array = [].concat( dest.options );
            addSelecterIfUnique( src, dest );
            expect(dest.options).to.deep.equal(base_array, "終端に既存");
        });
    });

    
    describe( "::_showItemOnInputer()",function(){
        var showItemOnInputer = main.factoryImpl.action.getInstance().showItemOnInputer;
        var original;
        beforeEach(function(){
        });
        afterEach(function(){
        });

        it("選択されたドロップダウンメニューのvalueとtextをターゲットに設定する" ,function(){
            var dest = {
                "device_key_str" : "basekey",
                "device_name_str" : "basename"
            };
            var src = {
                "selected" : "",
                "options" :
                [
                    {"value" : "hoge",     "text": "ほげ"},
                    {"value" : "fuga",     "text": "フガ"},
                    {"value" : "piyo",     "text": "ぴよ"}
                ]
            };

            src.selected = src.options[0].value;
            showItemOnInputer( src, dest );

            // 以下、検証。
            expect(dest.device_key_str).to.equal(src.options[0].value);
            expect(dest.device_name_str).to.equal(src.options[0].text);

            // 選択位置を変えてテスト
            src.selected = src.options[2].value;
            showItemOnInputer( src, dest );
            expect(dest.device_key_str).to.equal(src.options[2].value);
            expect(dest.device_name_str).to.equal(src.options[2].text);

            src.selected = src.options[1].value;
            showItemOnInputer( src, dest );
            expect(dest.device_key_str).to.equal(src.options[1].value);
            expect(dest.device_name_str).to.equal(src.options[1].text);
        });
    });
});

