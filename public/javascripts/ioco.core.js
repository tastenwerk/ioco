/**
 * ioco.core.js
 *
 * main features and wrappers for the ioco eco system
 *
 * (c) TASTENWERK 2013
 *
 * web: http://iocojs.org
 *
 */
( function(){


  /**
   * draw a nice windows like loader
   */
  var loader = '<div class="loader"><div class="circle" /><div class="circle" /><div class="circle" /><div class="circle" /><div class="circle" /></div>';

  var _required = [];

  // used for global datasources namespace (knockoutjs or kendoui datasources for example)
  var sources = {};

  /**
   * require a javascript file
   *
   *
   * @param {String} path - the path object to require.
   * if path is an absolute path, it will be required as is
   * if not, /javascripts/ will be prepended
   *
   */
  function require( path ){
    if( path.indexOf('/') < 0 )
      path = '/javascripts/ioco.' + path + '.js';
    else if( path.indexOf('/') > 0 )
      path = '/javascripts/' + path + '.js';
    if( _required.indexOf( path ) >= 0 )
      return;
    else{
      _required.push( path );
      var scriptTag = '<script type="text/javascript" src="'+path+'"></script>';
      ioco.log('loaded script', path);
      $('body').append(scriptTag);
    }
  }


  /**
   * log a string to the console
   *
   * Examples:
   *
   *     ioco.log('error', 'something has gone wrong');
   *
   *
   * @param {String} - code: e.g.: 'error' (optional)
   * @param {String} - message
   * @api public
   */
  function log( code, message ){
    var args = Array.prototype.slice.call(arguments);
    if( code.match(/error/) )
      args.splice(0,1);
    try{
      console.log.apply( this, ['[ioco]'+ (code.match(/error/) ? (' ' + code) : '') + ':'].concat( args ));
    } catch(e){ console.log('logging not supported')}

  }

  /**
   * add a notification message to the
   * notification system
   */
  function notify( msg, type ){
    if( typeof(msg) === 'object' ){
      if( msg.error && msg.error instanceof Array && msg.error.length > 0 )
        msg.error.forEach( function( err ){
          ioco.notify( err, 'error' );
        });
      if( msg.notice && msg.notice instanceof Array && msg.notice.length > 0 )
        msg.notice.forEach( function( notice ){
          ioco.notify( notice );
        });
      return;
    }

    if( typeof(msg) === 'undefined' || msg.length < 1 )
      return;

    $.noticeAdd({
      text: msg,
      stay: (type && type !== 'notice'),
      type: type
    });
  };

  var root = this; // window of browser

  if( !root.ioco || typeof( root.ioco ) !== 'object' )
    root.ioco = {};
  root.ioco.notify = notify;
  root.ioco.loaderHtml = loader;
  root.ioco.prompt = prompt;
  root.ioco.require = require;
  root.ioco.sources = sources;
  root.ioco.log = log;

  $(document).ready(function(){
    root.ioco._csrf = $('#_csrf').val();
  });


})();

// Avoid "console" errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
      'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
      'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
      'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
      'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
      method = methods[length];

      // Only stub undefined methods.
      if (!console[method]) {
          console[method] = noop;
      }
    }
}());