/**
 * @fileoverview メイン・システム
 * @author       Ryoji Morita
 * @version      0.0.1
*/

// 必要なライブラリをロード
var http     = require( 'http' );
var socketio = require( 'socket.io' );
var fs       = require( 'fs' );
var colors   = require( 'colors' );
require( 'date-utils' );

const DataCmnt   = require( './js/DataCmnt' );
const DataPerson = require( './js/DataPerson' );
const DataSensor = require( './js/DataSensor' );
const Docomo     = require( './js/Docomo' );
const PlayMusic  = require( './js/PlayMusic' );


// Ver. 表示
var now = new Date();
console.log( "[main.js] " + now.toFormat("YYYY年MM月DD日 HH24時MI分SS秒").rainbow );
console.log( "[main.js] " + "ver.01 : app.js".rainbow );
console.log( "[main.js] " + "access to http://localhost:3000" );

// サーバー・オブジェクトを生成
var server = http.createServer();

// request イベント処理関数をセット
server.on( 'request', doRequest );

// 待ち受けスタート
server.listen( process.env.VMC_APP_PORT || 3000 );
console.log( "[main.js] Server running!" );

// request イベント処理
function doRequest(
  req,    // http.IncomingMessage オブジェクト : クライアントからのリクエストに関する機能がまとめられている
  res     // http.serverResponse  オブジェクト : サーバーからクライアントへ戻されるレスポンスに関する機能がまとめられている
){
  switch( req.url ){
  case '/':
    fs.readFile( './app/app.html', 'UTF-8',
      function( err, data ){
        if( err ){
          res.writeHead( 404, {'Content-Type': 'text/html'} );
          res.write( 'File Not Found.' );
          res.end();
          return;
        }
        res.writeHead( 200, {'Content-Type': 'text/html',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data );
        res.end();
      }
    );
  break;
  case '/app.js':
    fs.readFile( './app/app.js', 'UTF-8',
      function( err, data ){
        res.writeHead( 200, {'Content-Type': 'application/javascript',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data );
        res.end();
      }
    );
  break;
  case '/style.css':
    fs.readFile( './app/style.css', 'UTF-8',
      function( err, data ){
        res.writeHead( 200, {'Content-Type': 'text/css',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data );
        res.end();
      }
    );
  break;
  case '/bg.gif':
    fs.readFile( './app/bg.gif', 'binary',
      function( err, data ){
        res.writeHead( 200, {'Content-Type': 'image/gif',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data, 'binary' );
        res.end();
      }
    );
  break;
  case '/jQueryRotate.js':
    fs.readFile( './app/js_lib/jQueryRotate.js', 'UTF-8',
      function( err, data ){
        res.writeHead( 200, {'Content-Type': 'application/javascript',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data );
        res.end();
      }
    );
  break;
  case '/tmp/picture.jpg':
    fs.readFile( './tmp/picture.jpg', 'binary',
      function( err, data ){
        res.writeHead( 200, {'Content-Type': 'image/jpg',
                             'Access-Control-Allow-Origin': '*'
                      } );
        res.write( data, 'binary' );
        res.end();
      }
    );
  break;
  }
}


var io = socketio.listen( server );


//-----------------------------------------------------------------------------
// 起動の処理関数
//-----------------------------------------------------------------------------
var timerFlg;

var si_hdc1000_humi  = new DataSensor( 'si_hdc1000_humi'  );
var si_hdc1000_temp  = new DataSensor( 'si_hdc1000_temp'  );

var si_lps25h_atmos = new DataSensor( 'si_lps25h_atmos' );
var si_lps25h_temp  = new DataSensor( 'si_lps25h_temp'  );

var si_tsl2561_lux  = new DataSensor( 'si_tsl2561_lux'  );


startSystem();


/**
 * システムを開始する
 * @param {void}
 * @return {void}
 * @example
 * startSystem();
*/
function startSystem() {
  console.log( "[main.js] startSystem()" );

  timerFlg  = setInterval( function(){
                getSensorDataLast30s( "sudo ./board.out sensors" );
              }, 10000 );
};


//-----------------------------------------------------------------------------
// クライアントからコネクションが来た時の処理関数
//-----------------------------------------------------------------------------
io.sockets.on( 'connection', function( socket ){

  // 切断したときに送信
  socket.on( 'disconnect', function(){
    console.log( "[main.js] " + 'disconnect' );
//  io.sockets.emit("S_to_C_DATA", {value:"user disconnected"});
  });


  // Client to Server
  socket.on( 'C_to_S_NEW', function( data ){
    console.log( "[main.js] " + 'C_to_S_NEW' );
  });


  socket.on( 'C_to_S_DELETE', function( data ){
    console.log( "[main.js] " + 'C_to_S_DELETE' );
  });


  socket.on( 'C_to_S_GET', function( data ){
    console.log( "[main.js] " + 'C_to_S_GET' );
    console.log( "[main.js] data = " + data );

    var exec = require( 'child_process' ).exec;
    var ret  = exec( data,
      function( err, stdout, stderr ){
        console.log( "[main.js] stdout = " + stdout );
        console.log( "[main.js] stderr = " + stderr );
        if( err ){
          console.log( "[main.js] " + err );
        }

        io.sockets.emit( 'S_to_C_DATA', {value:stdout} );
    });
  });


  socket.on( 'C_to_S_GET_SENSOR_ONE_DAY', function( data ){
    console.log( "[main.js] " + 'C_to_S_GET_SENSOR_ONE_DAY' );
    console.log( "[main.js] data.date   = " + data.date );
    console.log( "[main.js] data.sensor = " + data.sensor );

    var file = '/media/pi/USBDATA/' + data.date + '_sensor.txt';

    var ret = false;
    switch( data.sensor )
    {
    case si_hdc1000_humi.name  : ret = si_hdc1000_humi.UpdateDataOneDay( file );  obj = si_hdc1000_humi.dataOneDay;  break;
    case si_hdc1000_temp.name  : ret = si_hdc1000_temp.UpdateDataOneDay( file );  obj = si_hdc1000_temp.dataOneDay;  break;

    case si_lps25h_atmos.name : ret = si_lps25h_atmos.UpdateDataOneDay( file ); obj = si_lps25h_atmos.dataOneDay; break;
    case si_lps25h_temp.name  : ret = si_lps25h_temp.UpdateDataOneDay( file );  obj = si_lps25h_temp.dataOneDay;  break;

    case si_tsl2561_lux.name  : ret = si_tsl2561_lux.UpdateDataOneDay( file );  obj = si_tsl2561_lux.dataOneDay;  break;
    }

    if( ret == false ){
      io.sockets.emit( 'S_to_C_SENSOR_ONE_DAY', {ret:false, value:JSON.stringify(obj)} );
    } else {
      io.sockets.emit( 'S_to_C_SENSOR_ONE_DAY', {ret:true, value:JSON.stringify(obj)} );
    }
  });


  socket.on( 'C_to_S_SET', function( data ){
    console.log( "[main.js] " + 'C_to_S_SET' );
    console.log( "[main.js] data = " + data );

    var exec = require( 'child_process' ).exec;
    var ret  = exec( data,
      function( err, stdout, stderr ){
        console.log( "[main.js] stdout = " + stdout );
        console.log( "[main.js] stderr = " + stderr );
        if( err ){
          console.log( "[main.js] " + err );
        }
      });
  });


  socket.on( 'C_to_S_CMNT', function( data ){
    console.log( "[main.js] " + 'C_to_S_CMNT' );
    console.log( "[main.js] data = " + data );

    var data = { time: hhmmss(), cmnt: data }
    var file = '/media/pi/USBDATA/' + yyyymmdd() + '_cmnt.txt';
    console.log( "[main.js] data.time = " + data.time );
    console.log( "[main.js] data.cmnt = " + data.cmnt );
    console.log( "[main.js] file = " + file );

    cmnt.Update( data );
    cmnt.AppendFile( file );
    var ret = cmnt.ReadFile( file );
  });


});


/**
 * 全センサの値を取得する
 * @param {string} cmd - 実行するコマンド
 * @return {void}
 * @example
 * getSensorDataLast30s();
*/
function getSensorDataLast30s( cmd ){
  console.log( "[main.js] getSensorDataLast30s()" );
  console.log( "[main.js] cmd = " + cmd );
  var exec = require( 'child_process' ).exec;
  var ret  = exec( cmd,
    function( err, stdout, stderr ){
      console.log( "[main.js] stdout = " + stdout );
      console.log( "[main.js] stderr = " + stderr );
      if(err){
        console.log( "[main.js] " + err );
      }

      var obj = (new Function("return " + stdout))();

      si_hdc1000_humi.UpdateDataLast30s( obj.si_hdc1000_humi );
      si_hdc1000_temp.UpdateDataLast30s( obj.si_hdc1000_temp );

      si_lps25h_atmos.UpdateDataLast30s( obj.si_lps25h_atmos );
      si_lps25h_temp.UpdateDataLast30s( obj.si_lps25h_temp );

      si_tsl2561_lux.UpdateDataLast30s( obj.si_tsl2561_lux );

      var data = { 
                   si_hdc1000_humi:0,
                   si_hdc1000_temp:0,
                   si_lps25h_atmos:0,
                   si_lps25h_temp:0,
                   si_tsl2561_lux:0
      };

      data.si_hdc1000_humi  = si_hdc1000_humi.dataLast30s;
      data.si_hdc1000_temp  = si_hdc1000_temp.dataLast30s;

      data.si_lps25h_atmos = si_lps25h_atmos.dataLast30s;
      data.si_lps25h_temp  = si_lps25h_temp.dataLast30s;

      data.si_tsl2561_lux  = si_tsl2561_lux.dataLast30s;
//      console.log( "[main.js] data = " + JSON.stringify(data) );

      var diff_all = false;
      console.log( "[main.js] diff_all = " + diff_all );
      io.sockets.emit( 'S_to_C_DATA_LAST30S', {diff:diff_all, value:JSON.stringify(data)} );
  });
}


/**
 * 数字が 1 桁の場合に 0 埋めで 2 桁にする
 * @param {number} num - 数値
 * @return {number} num - 0 埋めされた 2 桁の数値
 * @example
 * toDoubleDigits( 8 );
*/
var toDoubleDigits = function( num ){
  console.log( "[main.js] toDoubleDigits()" );
  console.log( "[main.js] num = " + num );
  num += "";
  if( num.length === 1 ){
    num = "0" + num;
  }
  return num;
};


/**
 * 現在の日付を YYYY_MM_DD 形式で取得する
 * @param {void}
 * @return {string} day - 日付
 * @example
 * yyyymmdd();
*/
var yyyymmdd = function(){
  console.log( "[main.js] yyyymmdd()" );
  var date = new Date();

  var yyyy = date.getFullYear();
  var mm   = toDoubleDigits( date.getMonth() + 1 );
  var dd   = toDoubleDigits( date.getDate() );

  var day = yyyy + '-' + mm + '-' + dd;
  console.log( "[main.js] day = " + day );
  return day;
};


/**
 * 現在の時刻を HH:MM:SS 形式で取得する
 * @param {void}
 * @return {string} time - 時刻
 * @example
 * hhmmss();
*/
var hhmmss = function(){
  console.log( "[main.js] hhmmss()" );
  var date = new Date();

  var hour = toDoubleDigits( date.getHours() );
  var min  = toDoubleDigits( date.getMinutes() );
  var sec  = toDoubleDigits( date.getSeconds() );

  var time = hour + ":" + min + ":" + sec;
  console.log( "[main.js] time = " + time );
  return time;
};
