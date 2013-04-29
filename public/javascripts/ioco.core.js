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

  
  /**
  * adds a blocking modal box to the whole
  * screen
  *
  * @param {String} [html] the html string to be rendered to this modal
  * also, action strings are valid:
  *
  * @param {Object} [options] options are:
  * * height: desired height of modal window
  * * before: callback function, before modal will be shown
  * * completed: callback function, after modal has been shown and is visible
  * * html: the html content (optional can be passed as first argument)
  * * $content: a dom object to be appended
  *
  * to the user.
  * * url: remote url, if this modal should be loaded from url
  * * on:
  *   new callback function. specify exact action by parsing the parameter
  *   on('close', function( $modal ) )
  *
  * @param {Function} [callback] the callback that should be triggered
  * after modal has been rendered.
  *
  * @example
  * ioco.modal('close')
  * closes the modal.
  */
  function modal( html, options ){

    function closeModal(){
      if( options && typeof(options.on) === 'function' )
        options.on('close', $('#ioco-modal') );
      $('.ioco-modal').fadeOut(300);
      setTimeout( function(){
        $('.ioco-modal').remove();
      }, 300);
      $(window).off( 'resize', checkModalHeight );
    }

    function checkModalHeight(){
      if( $('#ioco-modal').height() > $(window).height() - 40 )
        $('#ioco-modal').animate({ height: $(window).height() - 40 }, 200);
      else
        $('#ioco-modal').animate({ height: $('#ioco-modal').data('origHeight') }, 200);
    }

    function setupModalActions(){
      if( $('#ioco-modal .modal-sidebar').length > 0 ){
        $('#ioco-modal .modal-sidebar > .sidebar-nav li').on('click', function(){
          $(this).closest('ul').find('.active').removeClass('active');
          $('#ioco-modal .sidebar-content > div').hide();
          $($('#ioco-modal .sidebar-content > div')[$(this).index()]).show();
          $(this).addClass('active');
        }).first().click();
      }
      if( options && options.completed && typeof(options.completed) === 'function' )
        setTimeout(function(){ options.completed( $('#ioco-modal') ); }, 500 );
    }

    if( html === 'close' )
      return closeModal();
    else if( typeof(html) === 'object' ){
      options = html;
      html = null;
    }

    $('.ioco-modal').remove();
    $('body').append('<div id="ioco-modal-overlay" class="ioco-modal"/>')
      .append('<div id="ioco-modal" class="ioco-modal"><div class="modal-inner-wrapper" /></div>');
    var closeModalBtn = $('<a class="close-icn">&times;</a>');
    $('#ioco-modal').prepend(closeModalBtn);
    if( options.windowControls ){
      var countWinCtrlBtns = 1;
      for( ctrl in options.windowControls ){
        var winCtrlBtn = $('<a winCtrl="'+ctrl+'" class="modal-win-ctrl live-tipsy" href="#" original-title="'+options.windowControls[ctrl].title+'"><span class="icn '+options.windowControls[ctrl].icn+'" /></a>');
        winCtrlBtn.css( { right: 16*(countWinCtrlBtns++)+32 } );
        $('#ioco-modal').prepend(winCtrlBtn);
        winCtrlBtn.on('click', function(e){
          e.preventDefault();
          options.windowControls[$(this).attr('winCtrl')].callback( $('#ioco-modal') );
        })
      }
    }
    closeModalBtn.on('click', closeModal);
    $('#ioco-modal-overlay').fadeIn(200).on('click', closeModal);
    if( options && options.title )
      $('#ioco-modal').prepend('<span class="modal-title">'+options.title+'</span>');


    // height configuration
    if( options && options.height && typeof(options.height) === 'number' )
      $('#ioco-modal').css( 'height', options.height );
    $('#ioco-modal').data('origHeight', $('#ioco-modal').height());

    checkModalHeight();
    $(window).on( 'resize', checkModalHeight );

    if( options.url ){
      $('#ioco-modal .modal-inner-wrapper').load( options.url, function(){
        if( options && options.before && typeof(options.before) === 'function' )
          options.before( $('#ioco-modal') );
        $('#ioco-modal').fadeIn( 200 );
        setupModalActions();
      });
    } else {
      html = html || options.data || options.html;
      if( options.$content )
        $('#ioco-modal .modal-inner-wrapper').append( options.$content );
      else if( html )
        $('#ioco-modal .modal-inner-wrapper').html( html ).fadeIn(200);

      if( options && options.before && typeof(options.before) === 'function' )
        options.before( $('#ioco-modal') );
      setupModalActions();
    }

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
  root.ioco.modal = modal;

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