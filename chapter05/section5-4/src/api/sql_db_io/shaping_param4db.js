/**
 * [shaping_param4db.js]
 * 
 *  encoding=utf-8
 */


require('date-utils'); // Data() クラスのtoString()を拡張してくれる。
// const debug = require("./debugger.js");
var lib = require("../factory4require.js");
var factoryImpl = {};

// UTデバッグ用のHookポイント。運用では外部公開しないメソッドはこっちにまとめる。
exports.factoryImpl = factoryImpl;







var _isValidDateFormat = function( targetString ) {
	return ( 
		targetString.match(/^\d{4,4}-\d{2,2}-\d{2,2}$/) 
	 || targetString.match(/^\d{4,4}-\d{2,2}-\d{2,2} \d{2,2}:\d{2,2}:\d{2,2}.\d{3,3}$/) 
	);
};
factoryImpl[ "_isValidDateFormat" ] = new lib.Factory( _isValidDateFormat );


/**
 * HTTP::GETデータから、「SHOW操作」に必要なデータ郡を取得。
 * API呼び出しのフォーマットのチェックを兼ねる。フォーマット不正なら { "invalid" : "理由" } を返却。
 * 入力データは、getData = { device_key, pass_key } が期待値。
 * pass_keyは無くともスルーするが、その後の検証フェースでNGになる（見込み）。
 * 
 * @returns オブジェクト{ device_key: "" }。フォーマット違反なら{ "invalid" : "理由" }
 */
var getShowObjectFromGetData = function( getData ){
	var isValidDateFormat = factoryImpl._isValidDateFormat.getInstance();
	var valid_data = {};
	var date_start = (function( pastDay ){
		var now_date = new Date();
		var base_sec = now_date.getTime() - pastDay * 86400000; //日数 * 1日のミリ秒数;
		now_date.setTime( base_sec );
		return now_date;
	}( 28 )); // 4週間前までを取得、を基本とする。
	var date_end = new Date(); // 現時点までを取得。

	if( getData[ "device_key" ] ){
		valid_data[ "device_key" ] = getData["device_key"];
		valid_data[ "date_start" ] = getData.date_start ? getData.date_start : date_start.toFormat("YYYY-MM-DD"); // data-utilsモジュールでの拡張を利用。
		valid_data[ "date_end"   ] = getData.date_end ? getData.date_end : date_end.toFormat("YYYY-MM-DD") + " 23:59:59.999"; // その日の最後、として指定する。※「T」は付けない（json変換後だと付いてくるけど）;
		// 終端は、Query時に「その日の23:59」を指定しているので、「今日」でOK。

		if( !isValidDateFormat( valid_data.date_start ) ){
			valid_data[ "invalid" ] = "format of date is wrong.";
		}
		if( !isValidDateFormat( valid_data.date_end ) ){
			valid_data[ "invalid" ] = "format of date is wrong.";
		}
		if( getData["pass_key"] ){
			valid_data["pass_key"] = getData.pass_key;
		}
	}else{
		valid_data[ "invalid" ] = "parameter is INVAILD.";
	}

	return valid_data;
};
exports.getShowObjectFromGetData = getShowObjectFromGetData;




/**
 * HTTP::GETデータから、「Delete操作」に必要なデータ郡を取得。
 * API呼び出しのフォーマットのチェックを兼ねる。フォーマット不正なら { "invalid" : "理由" } を返却。
 * 入力データは、getData = { device_key, pass_key } が期待値。
 * pass_keyは無くともスルーするが、その後の検証フェースでNGになる（見込み）。
 * 
 * @returns オブジェクト{ device_key: "" }。フォーマット違反なら{ "invalid" : "理由" }
 */
exports.getDeleteObjectFromPostData = function( postedData ){
	var isValidDateFormat = factoryImpl._isValidDateFormat.getInstance();
	var valid_data = {};
	// date_startは指定しない。
	var date_end = (function( pastDay ){
		var now_date = new Date();
		var base_sec = now_date.getTime() - pastDay * 86400000; //日数 * 1日のミリ秒数;
		now_date.setTime( base_sec );
		return now_date;
	}( 28 )); // 4週間前、より以前を削除対象とする、を基本とする。


	if( postedData[ "device_key" ] ){
		valid_data[ "device_key" ] = postedData["device_key"];
		if( postedData.date_start ){
			valid_data[ "date_start" ] =  postedData.date_start; // 指定があるときだけ、設定。
		}
		valid_data[ "date_end"   ] = postedData.date_end ? postedData.date_end : date_end.toFormat("YYYY-MM-DD");

		if( valid_data.date_start && !isValidDateFormat( valid_data.date_start ) ){
			valid_data[ "invalid" ] = "format of date is wrong.";
		}
		if( !isValidDateFormat( valid_data.date_end ) ){
			valid_data[ "invalid" ] = "format of date is wrong.";
		}
		if( postedData["pass_key"] ){
			valid_data["pass_key"] = postedData.pass_key;
		}
	}else{
		valid_data[ "invalid" ] = "parameter is INVAILD.";
	}

	return valid_data;
};



var getInsertObjectFromPostData = function( postData ){
	var valid_data = {};
	
		if( postData["type_value"] && isFinite(postData[ "type_value" ]) ){
			// 数字変換（int）出来る事、も必須。ただし、文字列のままで格納。
			valid_data[ "type_value" ] = postData[ "type_value" ];
		}else{
			valid_data[ "invalid" ] = "there is not valid type_value. that must be number.";
		}
	
		if( postData["device_key"] ){
			valid_data[ "device_key" ] = postData["device_key"];
		}else{
			valid_data[ "invalid" ] = "there is not device_key.";
		}

		if( postData["pass_key"] ){
			valid_data["pass_key"] = postData.pass_key; // アンダーバーの有無注意
		}else{
			valid_data[ "invalid" ] = "parameter is luck.";
		}

		return valid_data;
};
exports.getInsertObjectFromPostData = getInsertObjectFromPostData;




