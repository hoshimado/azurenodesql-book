/**
 * [events.js]
 * encoding=utf-8
 */
var events_api = {};


var _parseQuery = function (queryStr) {
    var hash  = queryStr.split('&');
    var n = hash.length, array, query = {};
    while(0<n--){
        array = hash[n].split("=");
        query[ array[0] ] = array[1];
    }
    return query;
}

var promiseEventsArray = function (queryStr) {

    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, 1000); // ロードの都合で1秒待ち。

    }).then(function(){
        var query = queryStr ? _parseQuery(queryStr) : null;
        return events_api._getScrapingEvents(query);

    }).then(function(result) {
        var array = [];

        if( result.status==200 ){
            array = array.concat( result.data );
        }
        array = array.concat( events_api._getNationalHolidaysArray() );
        return Promise.resolve( array );
    }).catch(function (err) {
        // エラーは読み捨て。日本の祝日だけを格納して返す。
        console.log(err);
        var array = events_api._getNationalHolidaysArray();
        return Promise.resolve( array );
    });
};


var _getScrapingEvents = function (query) {
    if(!query){
        // queryが無効の時はこちらが呼ばれる。
        return _stub_axios_get();
    }else{
        // queryが有効な時はこちらが呼ばれる。
        // サーバー側での実装が無いとエラーするので注意。
        return events_api.axios.get(
            "./api/v1/show/event",
            {
                "crossdomain" : true,
                "params" : {
                    "username" : query.username
                }
            }
        );
    }
}
var _stub_axios_get = function () {
    return Promise.resolve({
        "status" : 200,
        "data" : [
            { "start" : "2018-04-22", "title" : "#3good" }
        ]
    });
}


var _getNationalHolidaysArray = function () {
    // http://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html
    return [
        {"color" : "red", "start" : "2017-01-01", "title" : "元日" },
        {"color" : "red", "start" : "2017-01-02", "title" : "休日" },
        {"color" : "red", "start" : "2017-01-09", "title" : "成人の日" },
        {"color" : "red", "start" : "2017-02-11", "title" : "建国記念の日" },
        {"color" : "red", "start" : "2017-03-20", "title" : "春分の日" },
        {"color" : "red", "start" : "2017-04-29", "title" : "昭和の日" },
        {"color" : "red", "start" : "2017-05-03", "title" : "憲法記念日" },
        {"color" : "red", "start" : "2017-05-04", "title" : "みどりの日" },
        {"color" : "red", "start" : "2017-05-05", "title" : "こどもの日" },
        {"color" : "red", "start" : "2017-07-17", "title" : "海の日" },
        {"color" : "red", "start" : "2017-08-11", "title" : "山の日" },
        {"color" : "red", "start" : "2017-09-18", "title" : "敬老の日" },
        {"color" : "red", "start" : "2017-09-23", "title" : "秋分の日" },
        {"color" : "red", "start" : "2017-10-09", "title" : "体育の日" },
        {"color" : "red", "start" : "2017-11-03", "title" : "文化の日" },
        {"color" : "red", "start" : "2017-11-23", "title" : "勤労感謝の日" },
        {"color" : "red", "start" : "2017-12-23", "title" : "天皇誕生日" },
        {"color" : "red", "start" : "2018-01-01", "title" : "元日" },
        {"color" : "red", "start" : "2018-01-08", "title" : "成人の日" },
        {"color" : "red", "start" : "2018-02-11", "title" : "建国記念の日" },
        {"color" : "red", "start" : "2018-02-12", "title" : "休日" },
        {"color" : "red", "start" : "2018-03-21", "title" : "春分の日" },
        {"color" : "red", "start" : "2018-04-29", "title" : "昭和の日" },
        {"color" : "red", "start" : "2018-04-30", "title" : "休日" },
        {"color" : "red", "start" : "2018-05-03", "title" : "憲法記念日" },
        {"color" : "red", "start" : "2018-05-04", "title" : "みどりの日" },
        {"color" : "red", "start" : "2018-05-05", "title" : "こどもの日" },
        {"color" : "red", "start" : "2018-07-16", "title" : "海の日" },
        {"color" : "red", "start" : "2018-08-11", "title" : "山の日" },
        {"color" : "red", "start" : "2018-09-17", "title" : "敬老の日" },
        {"color" : "red", "start" : "2018-09-23", "title" : "秋分の日" },
        {"color" : "red", "start" : "2018-09-24", "title" : "休日" },
        {"color" : "red", "start" : "2018-10-08", "title" : "体育の日" },
        {"color" : "red", "start" : "2018-11-03", "title" : "文化の日" },
        {"color" : "red", "start" : "2018-11-23", "title" : "勤労感謝の日" },
        {"color" : "red", "start" : "2018-12-23", "title" : "天皇誕生日" },
        {"color" : "red", "start" : "2018-12-24", "title" : "休日" },
        {"color" : "red", "start" : "2019-01-01", "title" : "元日" },
        {"color" : "red", "start" : "2019-01-14", "title" : "成人の日" },
        {"color" : "red", "start" : "2019-02-11", "title" : "建国記念の日" },
        {"color" : "red", "start" : "2019-03-21", "title" : "春分の日" },
        {"color" : "red", "start" : "2019-04-29", "title" : "昭和の日" },
        {"color" : "red", "start" : "2019-05-03", "title" : "憲法記念日" },
        {"color" : "red", "start" : "2019-05-04", "title" : "みどりの日" },
        {"color" : "red", "start" : "2019-05-05", "title" : "こどもの日" },
        {"color" : "red", "start" : "2019-05-06", "title" : "休日" },
        {"color" : "red", "start" : "2019-07-15", "title" : "海の日" },
        {"color" : "red", "start" : "2019-08-11", "title" : "山の日" },
        {"color" : "red", "start" : "2019-08-12", "title" : "休日" },
        {"color" : "red", "start" : "2019-09-16", "title" : "敬老の日" },
        {"color" : "red", "start" : "2019-09-23", "title" : "秋分の日" },
        {"color" : "red", "start" : "2019-10-14", "title" : "体育の日" },
        {"color" : "red", "start" : "2019-11-03", "title" : "文化の日" },
        {"color" : "red", "start" : "2019-11-04", "title" : "休日" },
        {"color" : "red", "start" : "2019-11-23", "title" : "勤労感謝の日" }
    ];
};


if( this.window ){
    // ブラウザ環境での動作
    var browserThis = this;
    this.window.onload = function(){
        events_api["axios"] = (browserThis.window) ? browserThis.axios : {}; // ダミー
    };
}else{
    exports.events_api = events_api;
    exports.promiseEventsArray = promiseEventsArray;
}
events_api["_getNationalHolidaysArray"] = _getNationalHolidaysArray;
events_api["_getScrapingEvents"] = _getScrapingEvents;
