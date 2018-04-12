/**
 * [vue_simple.js]
    encoding=utf-8
 */


var _vueApp = function( createVueInstance ){
    var app = createVueInstance({
        el: '#app',
        data: {
            message : "Hello Vue!"
        },
        methods : {
            reverseMessage : function(){
                this.message = this.message.split('').reverse().join('')
            }
        }
    })
};


if( this.window ){
    var CREATE_VUE_INSTANCE = function(options){
        return new Vue(options);
    };
    window.onload = function(){
        // html側のDOM読み込みが終わってから、
        // Vue.jsを適用する。
        _vueApp( CREATE_VUE_INSTANCE );
    };
}else{
    exports.vueApp = _vueApp;
}


