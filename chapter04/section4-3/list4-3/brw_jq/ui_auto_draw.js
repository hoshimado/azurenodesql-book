/*
    [ui_auto_draw.js]
    encoding=UTF-8
 */


var auto_draw_with_default_parameter = function(
    jqPanelButton, // return of bindExpandCollapsePanel( idCtrlPanel )
    idAzureDomain, // "azure_domain"
    idDeviceKey,   // "id_device_key"
    idResult,      // "id_result"
    funcUpdateChart // updateChart()
){
    /**
     * @description 「■■■」で表現する、減っていくプログレスバー。
     * @param{Objcet} jqDiv 表示先のDiv-jQueryオブジェクト
     * @param{Number} countDownSecond 秒数
     */
    var dfd_progressbar_left = function( jqDiv, countDownSecond ){
        // 20行未満なので、ライブラリ引っ張らずに自前実装。
        var n = countDownSecond;
        var dfd = $.Deferred();
        var countDown = function(){
            var i = n, str = "";
            if( 0<n-- ){
                while(0<i--){ // IE考慮してfill()無しで、、、ってcanvas利用だからIE考慮不要か。後から気づいた。まぁいいや。
                    str += "■";
                }
                jqDiv.empty();
                jqDiv.append(str);
                setTimeout( countDown, 1000 );
            }else{
                dfd.resolve();
            }
        };
        countDown();
        return dfd;
    };
    var dfd_init_drawing = $.Deferred();

    setTimeout( function(){
        var azure_domain = $("#" + idAzureDomain);
        var device_key   = $("#" + idDeviceKey);
        var azure_str, device_str;
        var dfd_1st_load, dfd_2nd_retry = $.Deferred();

        if( (device_key.size() > 0) && (azure_domain.size() > 0) ){
            azure_str = azure_domain.val();
            device_str = device_key.val();
            dfd_1st_load = funcUpdateChart("#" + idResult, azure_str, device_str);
        }else{
            dfd_1st_load = $.Deferred();
            dfd_1st_load.reject();
        }
        dfd_1st_load.done(function(){
            // チャート描画、正常終了。
            dfd_init_drawing.resolve();
        }).fail(function(jqXHR, textStatus, errorThrown){
            // チャート描画のためのデータLoadに失敗。
            var result_node = $("#id_result");
            if( textStatus == "timeout" ){
                // タイムアウト時は1回だけ、30秒待機後にリトライ。
                result_node.empty(); // <i class=\"fa fa-spinner fa-spin\"></i>
                result_node.append("※コールドスタンバイからの復帰中。30秒お待ちください・・・。<br><div id=\"_id_countdown\"></div>");
                dfd_progressbar_left( $("#_id_countdown"), 30 )
                .done(function(){
                    dfd_2nd_retry.resolve();
                });
            }else{
                // タイムアウト以外が原因（そもそもajax呼ばずにreject()とかも含む）。
                dfd_2nd_retry.reject();
            }
        });
        dfd_2nd_retry.done(function(){
            funcUpdateChart("#" + idResult, azure_str, device_str)
            .done(function(){
                dfd_init_drawing.resolve();
            }).fail(function(jqXHR, textStatus, errorThrown){
                dfd_init_drawing.reject();
            });
        }).fail(function(){
            jqPanelButton.click();
            dfd_init_drawing.reject();
        });
    }, 700);
    return dfd_init_drawing;
};

