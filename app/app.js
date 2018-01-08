/**
 * @fileoverview アプリケーション UI
 * @author       Ryoji Morita
 * @version      0.0.1
*/
var sv_ip   = "aqua.rp.lfx.sony.co.jp";   // node.js server の IP アドレス
//var sv_ip   = "43.31.78.45";                // node.js server の IP アドレス
//var sv_ip   = "192.168.91.11";              // node.js server の IP アドレス
var sv_port = 3000;                           // node.js server の port 番号

var server = io.connect( "http://" + sv_ip + ":" + sv_port ); //ローカル


//-----------------------------------------------------------------------------
//-------------------------------------
var obj_sa_water        = {chart:null, data:null, color:'#1565C0', title:"水位", unit:"[cm?]"};
var obj_si_hdc1000_humi = {chart:null, data:null, color:'#00796B', title:"湿度(hdc1000)", unit:"[%]"};
var obj_si_hdc1000_temp = {chart:null, data:null, color:'#C2185B', title:"温度(hdc1000)", unit:"[℃]"};
var obj_si_lps25h_atmos = {chart:null, data:null, color:'#1976D2', title:"気圧(lps25h)", unit:"[hPa]"};
var obj_si_lps25h_temp  = {chart:null, data:null, color:'#C2185B', title:"温度(lps25h)", unit:"[℃]"};
var obj_si_tsl2561_lux  = {chart:null, data:null, color:'#AFB42B', title:"照度(tsl2561)", unit:"[LUX]"};

var obj_top_sa_water        = {chart:null, data:null, color:'#1565C0', title:"水位", unit:"[cm?]"};
var obj_top_si_hdc1000_humi = {chart:null, data:null, color:'#00796B', title:"湿度(hdc1000)", unit:"[%]"};
var obj_top_si_hdc1000_temp = {chart:null, data:null, color:'#C2185B', title:"温度(hdc1000)", unit:"[℃]"};

var obj_sensors_daily = {chart:null, data:null};


// ブラウザオブジェクトから受け取るイベント
window.onload = function(){
  console.log( "[app.js] window.onloaded" );

  obj_sa_water        = makeChart30s( "cid_sa_water",        obj_sa_water        );
  obj_si_hdc1000_humi = makeChart30s( "cid_si_hdc1000_humi", obj_si_hdc1000_humi );
  obj_si_hdc1000_temp = makeChart30s( "cid_si_hdc1000_temp", obj_si_hdc1000_temp );
  obj_si_lps25h_atmos = makeChart30s( "cid_si_lps25h_atmos", obj_si_lps25h_atmos );
  obj_si_lps25h_temp  = makeChart30s( "cid_si_lps25h_temp",  obj_si_lps25h_temp  );
  obj_si_tsl2561_lux  = makeChart30s( "cid_si_tsl2561_lux",  obj_si_tsl2561_lux  );
  obj_sa_water.chart.render();
  obj_si_hdc1000_humi.chart.render();
  obj_si_hdc1000_temp.chart.render();
  obj_si_lps25h_atmos.chart.render();
  obj_si_lps25h_temp.chart.render();
  obj_si_tsl2561_lux.chart.render();

  obj_top_sa_water        = makeChart30s( "cid_top_sa_water",         obj_top_sa_water        );
  obj_top_si_hdc1000_humi = makeChart30s( "cid_top_si_hdc1000_humi",  obj_top_si_hdc1000_humi );
  obj_top_si_hdc1000_temp = makeChart30s( "cid_top_si_hdc1000_temp",  obj_top_si_hdc1000_temp );
  obj_top_sa_water.chart.render();
  obj_top_si_hdc1000_humi.chart.render();
  obj_top_si_hdc1000_temp.chart.render();

  obj_sensors_daily   = makeChart1d( "cid_sensors_daily",   "" );
  obj_sensors_daily.chart.render();
};


window.onunload = function(){
  console.log( "[app.js] window.onunloaded" );
};


/**
 * 30sec のデータを表示するグラフ ( チャート ) を作成する。
 * @param {string} domid - グラフを表示する DOM の ID 名
 * @param {object} obj - グラフ化する対象のオブジェクト
 * @return {object} chart - 作成するグラフのオブジェクトとデータ
 * @example
 * makeChart30s( "cid_sa_acc_x", obj_sa_acc_x );
*/
function makeChart30s( domid, obj ){
  console.log( "[app.js] makeChart30s()" );
  console.log( "[app.js] domid = " + domid );

  var data = new Array({label:"30秒前", y:0}, {label:"20秒前", y:0}, {label:"10秒前", y:0}, {label:"今", y:0});

  var chart = new CanvasJS.Chart(domid, {
    animationEnabled: true,
    animationDuration: 2000,
    title:{text: obj.title,
           fontColor: '#222',
           fontSize: 16,
    },
    subtitles:[{text: '単位: ' + obj.unit,
                fontColor: '#555',
                fontSize: 12,
               }
    ],
    axisX: { labelAngle:-45, labelFontSize:14, labelFontColor:'#222' },
    axisY: { labelFontSize:14, labelFontColor:'#222' },
    data: [{type: 'area',           // グラフの種類 (area, bar, bubble, column, stackedColumn )
            color: obj.color,
            cursor: "pointer",
            dataPoints: data        // グラフに描画するデータ
    }]
  });

  return {chart:chart, data:data};
};


/**
 * 1 day のデータを表示するグラフ ( チャート ) を作成する。
 * @param {string} domid - グラフを表示する DOM の ID 名
 * @param {string} title - グラフに表示するタイトル
 * @return {string} chart - 作成するグラフのオブジェクトとデータ
 * @example
 * makeChart1d( "chart_sensor_temp", "temp", data );
*/
function makeChart1d( domid, title ){
  console.log( "[app.js] makeChart1d()" );
  console.log( "[app.js] domid = " + domid );
  console.log( "[app.js] title = " + title );

  var data = new Array({label:"00-00", y:0}, {label:"01-00", y:0}, {label:"02-00", y:0}, {label:"03-00", y:0},
                       {label:"04-00", y:0}, {label:"05-00", y:0}, {label:"06-00", y:0}, {label:"07-00", y:0},
                       {label:"08-00", y:0}, {label:"09-00", y:0}, {label:"10-00", y:0}, {label:"11-00", y:0},
                       {label:"12-00", y:0}, {label:"13-00", y:0}, {label:"14-00", y:0}, {label:"15-00", y:0},
                       {label:"16-00", y:0}, {label:"17-00", y:0}, {label:"18-00", y:0}, {label:"19-00", y:0},
                       {label:"20-00", y:0}, {label:"21-00", y:0}, {label:"22-00", y:0}, {label:"23-00", y:0}
                      );

  var obj = new CanvasJS.Chart(domid, {
    title:{text: title},
    data: [{type: 'area',           // グラフの種類 (area, bar, bubble, column, stackedColumn )
            dataPoints: data        // グラフに描画するデータ
    }]
  });
  return {chart:obj, data:data};
};


//-----------------------------------------------------------------------------
// サーバから受け取るイベント
server.on( 'connect', function(){               // 接続時
  console.log( "[app.js] " + 'connected' );
});


server.on( 'disconnect', function( client ){    // 切断時
  console.log( "[app.js] " + 'disconnected' );
});


server.on( 'S_to_C_DATA', function( data ){
  console.log( "[app.js] " + 'S_to_C_DATA' );
  console.log( "[app.js] data = " + data.value );
//  window.alert( "コマンドを送信しました。\n\r" + data.value );

  document.getElementById("val_sensor").innerHTML = data.value; // 数値を表示
});


server.on( 'S_to_C_DATA_LAST30S', function( data ){
  console.log( "[app.js] " + 'S_to_C_DATA_LAST30S' );
//  console.log( "[app.js] data.diff  = " + data.diff );
//  console.log( "[app.js] data.value = " + data.value );

  var obj = (new Function( "return " + data.value ))();
  document.getElementById( "val_sa_water"        ).innerHTML = obj.sa_water["今"];        // 数値を表示
  document.getElementById( "val_si_hdc1000_humi" ).innerHTML = obj.si_hdc1000_humi["今"]; // 数値を表示
  document.getElementById( "val_si_hdc1000_temp" ).innerHTML = obj.si_hdc1000_temp["今"]; // 数値を表示
  document.getElementById( "val_si_lps25h_atmos" ).innerHTML = obj.si_lps25h_atmos["今"]; // 数値を表示
  document.getElementById( "val_si_lps25h_temp"  ).innerHTML = obj.si_lps25h_temp["今"];  // 数値を表示
  document.getElementById( "val_si_tsl2561_lux"  ).innerHTML = obj.si_tsl2561_lux["今"];  // 数値を表示

  updateChartLast30s( "obj_sa_water",        obj.sa_water        );
  updateChartLast30s( "obj_si_hdc1000_humi", obj.si_hdc1000_humi );
  updateChartLast30s( "obj_si_hdc1000_temp", obj.si_hdc1000_temp );
  updateChartLast30s( "obj_si_lps25h_atmos", obj.si_lps25h_atmos );
  updateChartLast30s( "obj_si_lps25h_temp",  obj.si_lps25h_temp  );
  updateChartLast30s( "obj_si_tsl2561_lux",  obj.si_tsl2561_lux  );

  // トップに表示しているグラフを更新する
  updateChartLast30s( "obj_top_sa_water",        obj.sa_water        );
  updateChartLast30s( "obj_top_si_hdc1000_humi", obj.si_hdc1000_humi );
  updateChartLast30s( "obj_top_si_hdc1000_temp", obj.si_hdc1000_temp );
});


server.on( 'S_to_C_SENSOR_ONE_DAY', function( data ){
  console.log( "[app.js] " + 'S_to_C_SENSOR_ONE_DAY' );
//  console.log( "[app.js] data = " + data );
  var str = $("#val_which").val();
//  console.log( "[app.js] str = " + str );

  if( data.ret == false ){
    window.alert( "データがありません。\n\r" );
  }

  var obj = (new Function("return " + data.value))();
  switch( str ){
    case 'sa_water'       : updateChartDaily( "sa_water",        obj ); break;
    case 'si_hdc1000_humi': updateChartDaily( "si_hdc1000_humi", obj ); break;
    case 'si_hdc1000_temp': updateChartDaily( "si_hdc1000_temp", obj ); break;
    case 'si_lps25h_atmos': updateChartDaily( "si_lps25h_atmos", obj ); break;
    case 'si_lps25h_temp' : updateChartDaily( "si_lps25h_temp",  obj ); break;
    case 'si_tsl2561_lux' : updateChartDaily( "si_tsl2561_lux",  obj ); break;
    default               : alert( "unknown sensor." ); break;
  }
});


server.on( 'S_to_C_TALK_CB', function(){
  console.log( "[app.js] " + 'S_to_C_TALK_CB' );
//    window.alert( "play  ****.wav が完了しました。\n\r" );
  recognition.start();
});


//-------------------------------------
/**
 * 30s 間のセンサ値をグラフ表示する。
 * @param {string} chart - 対象のグラフ
 * @param {object} data - グラフに表示するデータ
 * @return {void}
 * @example
 * updateChartLast30s( "chart_temp", obj.acc_x );
*/
function updateChartLast30s( chart, data ){
  console.log( "[app.js] updateChartLast30s()" );
  console.log( "[app.js] chart = " + chart );

//  var obj = (new Function("return " + data))();

  var i = 0;
  for( var key in data ){
    window[chart].data[i].label = key;
    window[chart].data[i].y     = data[key];
    i++;
  }

  window[chart].chart.options.data.dataPoints = window[chart].data;
  window[chart].chart.render();
}


/**
 * 1 day のセンサ値をグラフ表示する。
 * @param {string} title - グラフに表示するタイトル
 * @param {object} data - グラフに表示するデータ
 * @return {void}
 * @example
 * updateChartDaily( "temp", obj );
*/
function updateChartDaily( title, data ){
  console.log( "[app.js] updateChartDaily()" );
  console.log( "[app.js] title = " + title );

//  var obj = (new Function("return " + data))();

  var i = 0;
  for( var key in data ){
    obj_sensors_daily.data[i].label = key;
    obj_sensors_daily.data[i].y     = data[key];
    i++;
  }

  obj_sensors_daily.chart.options.title.text = title;
  obj_sensors_daily.chart.options.data.dataPoints = obj_sensors_daily.data;
  obj_sensors_daily.chart.render();
}


//-----------------------------------------------------------------------------
// ドキュメント・オブジェクトから受け取るイベント


//-----------------------------------------------------------------------------
/**
 * Get コマンドを送る。
 * @param {string} cmd - コマンドの文字列
 * @return {void}
 * @example
 * sendGetCmd( 'sudo ./board.out temp1' );
*/
function sendGetCmd( cmd ){
  console.log( "[app.js] sendGetCmd()" );
  console.log( "[app.js] cmd = " + cmd );

  console.log( "[app.js] server.emit(" + 'C_to_S_GET' + ")" );
  server.emit( 'C_to_S_GET', cmd );
}


/**
 * 指定した 1 日の、指定したセンサ値を取得するためのコマンドを送る。
 * @return {void}
 * @example
 * sendGetCmdSensorOneDay();
*/
function sendGetCmdSensorOneDay(){
  console.log( "[app.js] sendGetCmdSensorOneDay()" );

  var date   = $("#val_date").val();
  var sensor = $("#val_which").val();
  console.log( "[app.js] date   = " + date );
  console.log( "[app.js] sensor = " + sensor );

  if( date < "2018-01-11" ){
    alert( "2018/01/11 以降を指定してください。" );
  }

  var obj = { date:date, sensor:sensor };
  console.log( "[app.js] server.emit(" + 'C_to_S_GET_SENSOR_ONE_DAY' + ")" );
  server.emit( 'C_to_S_GET_SENSOR_ONE_DAY', obj );
}


/**
 * Set コマンドを送る。
 * @param {string} cmd - コマンドの文字列
 * @return {void}
 * @example
 * sendSetCmd( 'sudo ./board.out relay on' );
*/
function sendSetCmd( cmd ){
  console.log( "[app.js] sendSetCmd()" );
  console.log( "[app.js] cmd = " + cmd );

  console.log( "[app.js] server.emit(" + 'C_to_S_SET' + ")" );
  server.emit( 'C_to_S_SET', cmd );
}


/**
 * 撮影している画を回す
 * @param {string} value - 回す角度
 * @return {void}
 * @example
 * rotateScreen( 90 );
*/
function rotateScreen( which, value ){
  console.log( "[app.js] rotateScreen()" );
  console.log( "[app.js] which = " + which );
  console.log( "[app.js] value = " + value );

  document.getElementById( "val_rotate" ).innerHTML = value.match( /\d+/ );
  $( "#" + which + " img").rotate( {angle:Number(value)} );
}


