/**
 * [manage_account.js]
    encoding=utf-8
 */

var _promiseCreateAccount = function( userNameStr, passKeyStr ){
    var url = "./api/v1/activitylog/signup";
    var axiosInstance = _acount_hook.axios;
    var promise = axiosInstance.post(
        url,
        { // postData
            "username" : userNameStr,
            "passkey" : passKeyStr
        }
    );
    return promise.then(function(result){
        return Promise.resolve( result.data );
    });
};



var account_lib = {
    "promiseCreateAccount" : _promiseCreateAccount
};
var _acount_hook = {
    "axios" : {} // この時点ではダミー
};
if( this.window ){
    /**
     * window.onload() のタイミングで実施するため、vue_client.js側でこれを呼び出す。
     * @param{Object} browserThis ブラウザのthisインスタンスを渡す。
     */
    account_lib["initialize"] = function( browserThis ){
        _acount_hook.axios = browserThis.axios;
    };
}else{
    exports.hook = _acount_hook;
    exports.promiseCreateAccount = _promiseCreateAccount;
}



