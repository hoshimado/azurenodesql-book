/*
    [jq_ui_panel.js]
    encoding=UTF-8
*/


var bindExpandCollapsePanel = function( idPanel ){
    var BGCOLOR = "#77ffcc";
    var CSS_EXPAND = {
	    "float" : "left",
        "line-height" : "0",
        "width" :  "0",
        "height" : "0",
        "border" : "10px solid " + BGCOLOR, /* transparent */
        "border-top" : "10px solid #000000",
        "padding-bottom": "0px"
    };
    var CSS_COLLAPSE = {
	    "float" : "left",
        "line-height" : "0",
        "width" :  "0",
        "height" : "0",
        "border" : "10px solid " + BGCOLOR, /* transparent */
        "border-left" : "10px solid #000000",
        "padding-bottom": "0px"
    };    
    var str = "<div id=\"\_id_expand_collapse_base\">"
    str += "<div id=\"_id_marker\"></div>";
    str += "<div id=\"_id_expand_collapse\">設定パネル</div>"
    str += "<div style=\"float: none; both: clear;\"></div>"
    str += "</div>";
    $("#"+idPanel).before(str);
    $("#"+idPanel).hide();

    $("#_id_marker").css(CSS_COLLAPSE);
    $("#_id_expand_collapse_base").css({
        "margin" : "4   px",
        "padding" : "8px",
    	"cursor" : "pointer",
        "backgroundColor" : BGCOLOR
    });
    $("#_id_expand_collapse").click(function(){
        if($("#"+idPanel).is(":visible")){
            $("#"+idPanel).slideUp();
            $("#_id_marker").css(CSS_COLLAPSE);
        }else{
            $("#"+idPanel).slideDown();
            $("#_id_marker").css(CSS_EXPAND);
        }
    });
    return $("#_id_expand_collapse");
};
