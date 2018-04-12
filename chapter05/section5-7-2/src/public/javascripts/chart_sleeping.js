/**
 * [chart_sleeping.js]
    encoding=utf-8
 */


 // ブラウザとNode.jsの互換を取る。
var ACTIVITY; // ブラウザ環境では、vue_client.jsを後から読み込むことで上書きされる。
if( !this.window ){
    ACTIVITY = require("./vue_client.js").ACTIVITY;
}


var _CHART = function( browserThis, targetCanvasId ){
    var canvasNode = browserThis.document.getElementById( targetCanvasId );
    this._ctx = canvasNode.getContext("2d");
    this._myChart = null;
    this._lastType = null;
}; 
_CHART.prototype.show = function( labels, datasets, chartType ){
    if( !chartType ){
        chartType = this._lastType ? this._lastType : "bar";
    }
    if( this._lastType && (this._lastType != chartType) ){
        // グラフの種別変更（線グラフ、棒グラフ）するには、一度破棄する必要あるらしい？
        // https://stackoverflow.com/questions/36949343/chart-js-dynamic-changing-of-chart-type-line-to-bar-as-example
        //
        // 本家のDocsによると「グラフ種別ごとにインスタンスを生成する」（から変更できない）っぽい。
        // update()が更新するのはdataプロパティだけ、とのこと。
        // http://www.chartjs.org/docs/latest/developers/updates.html
        // http://www.chartjs.org/docs/latest/developers/api.html
        // > This can be safely called after updating the data object.  
        // > This will update all scales, legends, and then re-render the chart.
        // > 以下、サンプルは略。
        this._myChart.destroy();
        this._myChart = null;
    }
    if( !this._myChart ){
        this._lastType = chartType;
        this._myChart = new Chart(this._ctx, {
            "type" : chartType,
            "responsive" : true,
            "data" : {
                "labels" : labels,
                "datasets" : datasets
            },
            "options" : { // このシート見やすい⇒ https://qiita.com/masatatsu/items/a311e88f19eecd8f47ab
                "scales" : {
                    "yAxes": [{                      //y軸設定
                        "display": true,             //表示設定
                        "scaleLabel": {              //軸ラベル設定
                           // "fontSize": 18,               //フォントサイズ
                           "display": true,          //表示設定
                           "labelString": '睡眠時間'  //ラベル
                        },
                        "ticks": {                      //最大値最小値設定
                            // "fontSize": 18,             //フォントサイズ
                            "min": 0,                   //最小値
                            "max": 10,                  //最大値
                            "stepSize": 2               //軸間隔
                        },
                    }],
                }
            }
        });
    }else{
        this._myChart.type = chartType;
        this._myChart.data.labels = labels;
        this._myChart.data.datasets = datasets;
        this._myChart.update();
    }
};


/**
 * 与えられた日時と行動種別から、「就寝⇒起床」までの時間を算出する。
 * @param{Array}  activitiyArray   [{created_at, type},,,,] の形式であること。
 * @returns{Object} 「{"date" : [], "sleepingtime" ; []}」の形式を返却する。
 */
var _convertSleepTime6MarkingTimeTwice = function( activitiyArray ){
    var elapsed1, elapsed2, elapsedMatrix = { "date" : [], "sleepingtime" : [] };
    var i, n = activitiyArray.length;

    i = 0;
    while (i < n) {
        while( (i<n) && (activitiyArray[i].type != ACTIVITY.GOTO_BED.type ) ){ 
            i++; 
        }
        while( (i<n-1) && (activitiyArray[i+1].type == ACTIVITY.GOTO_BED.type ) ){ 
            i++; 
        }
        if( i==n ){
            break;
        }
        elapsed1 = new Date( activitiyArray[i].created_at );

        while( (i<n) && (activitiyArray[i].type != ACTIVITY.GET_UP.type ) ){ 
            i++; 
        }
        while( (i<n-1) && (activitiyArray[i+1].type == ACTIVITY.GET_UP.type ) ){ 
            i++; 
        }
        if( i==n ){
            break;
        }

        elapsed2 = new Date( activitiyArray[i].created_at );
        elapsedMatrix.date.push( elapsed2.toLocaleDateString() );
        elapsedMatrix.sleepingtime.push( (elapsed2 - elapsed1) /1000 /3600 );
    }
    // dt1.toLocaleString()

    return elapsedMatrix;
};

/**
 * 与えられた日時と行動種別から、グラフを描く。
 * @param{Array}  activitiyData   [{created_at, type},,,,] の形式であること。
 * @param{String} chartTypeString グラフの表示方法を文字列で指定する。省略可能。"bar", "line", など。Chart.js準拠。
 */
var _plot2Chart = function( activitiyData, chartTypeString ){
    var chartData = _chart_hook.convertSleepTime6MarkingTimeTwice( activitiyData );
    var horizonArray = chartData.date;
    var verticalArray = chartData.sleepingtime;

    _chart_hook.chartInstance.show( 
        horizonArray, 
        [{
            "label" : "睡眠時間",
            data : verticalArray,
            backgroundColor: "rgba(153,255,51,0.4)"
        }],
        chartTypeString // "bar", "line",,, show()側のデフォルトを「bar」に設定した。
    );
};


var chartsleeping_lib = {
    "plot2Chart" : _plot2Chart,
};
var _chart_hook = {
    "convertSleepTime6MarkingTimeTwice" : _convertSleepTime6MarkingTimeTwice,
    "chartInstance" : {} // ダミー
};
if( this.window ){
    /**
     * window.onload() のタイミングで実施するため、vue_client.js側でこれを呼び出す。
     * @param{Object} browserThis ブラウザのthisインスタンスを渡す。
     */
    chartsleeping_lib["initialize"] = function( browserThis ){
        _chart_hook.chartInstance = new _CHART( browserThis, "id_chart" );
    };
}else{
    exports.hook = _chart_hook;
    exports.plot2Chart = _plot2Chart;
}



