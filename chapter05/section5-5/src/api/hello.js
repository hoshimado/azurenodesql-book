/**
 * [hello.js]
 * 
 * encoding=utf-8
 */

 
/**
 * GETメソッドで呼び出されて、Queryに入っている「name」の値を取り出して
 * 「Hello world」に追加で返すだけのAPI。
 */
exports.world = function( queryFromGet, dataFromPost ){
    var name = queryFromGet.name;
    var out_data = { 
        "status" : 200,
        "jsonData" : "hello world, " + name + "!" 
    };
    var promise = new Promise(function(resolve,reject){
        setTimeout(function() {
            // 非同期の処理を模している。
            resolve( out_data );
        }, 100);
    });
    return promise;
};


