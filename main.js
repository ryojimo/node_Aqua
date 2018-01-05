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

var cmnt    = new DataCmnt();

var sa_acc_x   = new DataSensor( 'sa_acc_x'   );
var sa_acc_y   = new DataSensor( 'sa_acc_y'   );
var sa_acc_z   = new DataSensor( 'sa_acc_z'   );

var sa_gyro_g1 = new DataSensor( 'sa_gyro_g1' );
var sa_gyro_g2 = new DataSensor( 'sa_gyro_g2' );

var si_bme280_atmos = new DataSensor( 'si_bme280_atmos' );
var si_bme280_humi  = new DataSensor( 'si_bme280_humi'  );
var si_bme280_temp  = new DataSensor( 'si_bme280_temp'  );

var si_gp2y0e03     = new DataSensor( 'si_gp2y0e03'     );

var si_lps25h_atmos = new DataSensor( 'si_lps25h_atmos' );
var si_lps25h_temp  = new DataSensor( 'si_lps25h_temp'  );

var si_tsl2561_lux  = new DataSensor( 'si_tsl2561_lux'  );

var docomo  = new Docomo();
var music   = new PlayMusic();
var music_pid = 0;


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
    case sa_acc_x.name   : ret = sa_acc_x.UpdateDataOneDay( file );   obj = sa_acc_x.dataOneDay;   break;
    case sa_acc_y.name   : ret = sa_acc_y.UpdateDataOneDay( file );   obj = sa_acc_y.dataOneDay;   break;
    case sa_acc_z.name   : ret = sa_acc_z.UpdateDataOneDay( file );   obj = sa_acc_z.dataOneDay;   break;
    case sa_gyro_g1.name : ret = sa_gyro_g1.UpdateDataOneDay( file ); obj = sa_gyro_g1.dataOneDay; break;
    case sa_gyro_g2.name : ret = sa_gyro_g2.UpdateDataOneDay( file ); obj = sa_gyro_g2.dataOneDay; break;

    case si_bme280_atmos.name : ret = si_bme280_atmos.UpdateDataOneDay( file ); obj = si_bme280_atmos.dataOneDay; break;
    case si_bme280_humi.name  : ret = si_bme280_humi.UpdateDataOneDay( file );  obj = si_bme280_humi.dataOneDay;  break;
    case si_bme280_temp.name  : ret = si_bme280_temp.UpdateDataOneDay( file );  obj = si_bme280_temp.dataOneDay;  break;

    case si_gp2y0e03.name     : ret = si_gp2y0e03.UpdateDataOneDay( file );     obj = si_gp2y0e03.dataOneDay;     break;

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


  socket.on( 'C_to_S_MUSIC', function( data ){
    console.log( "[main.js] " + 'C_to_S_MUSIC' );

    if( data == 'GET PID' ){
      music.GetPID( function( id ){
        music_pid = id;
        console.log( "[main.js] " + "pid=" + music_pid );
      });
    } else if( data == 'PLAY' ){
      music.Play( 'Coldplay.mp3' );
    } else {
      music.ChangeStatus( data );
    }
  });


  socket.on( 'C_to_S_TALK', function( cmnt ){
    console.log( "[main.js] " + 'C_to_S_TALK' );
    console.log( "[main.js] cmnt = " + cmnt );

    docomo.Update( "nozomi", "hello" );
    docomo.Talk( cmnt, function(){
      io.sockets.emit( 'S_to_C_TALK_CB', {value:true} )
    });
  });


  socket.on( 'C_to_S_TALK_W_NAME', function( data ){
    console.log( "[main.js] " + 'C_to_S_TALK_W_NAME' );
    console.log( "[main.js] data = " + data );
    console.log( "[main.js] data.talker = " + data.talker );
    console.log( "[main.js] data.cmnt   = " + data.cmnt );

    docomo.Update( data.talker , "hello" );
    docomo.Talk( data.cmnt, function(){
    });
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

      sa_acc_x.UpdateDataLast30s( obj.sa_acc_x );
      sa_acc_y.UpdateDataLast30s( obj.sa_acc_y );
      sa_acc_z.UpdateDataLast30s( obj.sa_acc_z );
      sa_gyro_g1.UpdateDataLast30s( obj.sa_gyro_g1 );
      sa_gyro_g2.UpdateDataLast30s( obj.sa_gyro_g2 );

      si_bme280_atmos.UpdateDataLast30s( obj.si_bme280_atmos );
      si_bme280_humi.UpdateDataLast30s( obj.si_bme280_humi );
      si_bme280_temp.UpdateDataLast30s( obj.si_bme280_temp );

      si_gp2y0e03.UpdateDataLast30s( obj.si_gp2y0e03 );

      si_lps25h_atmos.UpdateDataLast30s( obj.si_lps25h_atmos );
      si_lps25h_temp.UpdateDataLast30s( obj.si_lps25h_temp );

      si_tsl2561_lux.UpdateDataLast30s( obj.si_tsl2561_lux );

      var data = { sa_acc_x:0,
                   sa_acc_y:0,
                   sa_acc_z:0,
                   sa_gyro_g1:0,
                   sa_gyro_g2:0,
                   si_bme280_atmos:0,
                   si_bme280_humi:0,
                   si_bme280_temp:0,
                   si_gp2y0e03:0,
                   si_lps25h_atmos:0,
                   si_lps25h_temp:0,
                   si_tsl2561_lux:0
      };

      data.sa_acc_x   = sa_acc_x.dataLast30s;
      data.sa_acc_y   = sa_acc_y.dataLast30s;
      data.sa_acc_z   = sa_acc_z.dataLast30s;
      data.sa_gyro_g1 = sa_gyro_g1.dataLast30s;
      data.sa_gyro_g2 = sa_gyro_g2.dataLast30s;

      data.si_bme280_atmos = si_bme280_atmos.dataLast30s;
      data.si_bme280_humi  = si_bme280_humi.dataLast30s;
      data.si_bme280_temp  = si_bme280_temp.dataLast30s;

      data.si_gp2y0e03     = si_gp2y0e03.dataLast30s;

      data.si_lps25h_atmos = si_lps25h_atmos.dataLast30s;
      data.si_lps25h_temp  = si_lps25h_temp.dataLast30s;

      data.si_tsl2561_lux  = si_tsl2561_lux.dataLast30s;
//      console.log( "[main.js] data = " + JSON.stringify(data) );

      // 加速度センサとジャイロセンサの "10秒前" と" 今" の値に大きな差があるか？をチェック
      var diff_sa_acc_x   = false;
      var diff_sa_acc_y   = false;
      var diff_sa_acc_z   = false;
      var diff_sa_gyro_g1 = false;
      var diff_sa_gyro_g2 = false;

      diff_sa_acc_x   = sa_acc_x.IsLargeDiff();
      diff_sa_acc_y   = sa_acc_y.IsLargeDiff();
      diff_sa_acc_z   = sa_acc_z.IsLargeDiff();
      diff_sa_gyro_g1 = sa_gyro_g1.IsLargeDiff();
      diff_sa_gyro_g2 = sa_gyro_g2.IsLargeDiff();

      var diff_all = false;
      if( diff_sa_acc_x   == true || diff_sa_acc_z   == true ||
          diff_sa_gyro_g1 == true || diff_sa_gyro_g2 == true ){
        diff_all = true;
      }

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
