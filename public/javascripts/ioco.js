ioco = typeof(ioco) !== 'undefined' && ioco || {};

ioco.mode = 'remote';

ioco.main = {
    show: function( text, options, callback ){
      if( !callback && options && typeof(options) === 'function' )
        callback = options;
      $('#ioco-main-content').fadeOut(200, function(){
        $('#ioco-main-content').html( text ).fadeIn( 200, function(){
          if( callback && typeof(callback) === 'function' )
            callback( $('#ioco-main-content') );
        });
      });
    },
    load: function( url, callback ){
      $('#ioco-main-content').fadeOut( 200, function(){
        $('#ioco-main-content').load( url, function(){
          $('#ioco-main-content').fadeIn( 200, function(){
            if( callback && typeof(callback) === 'function' )
              callback( $('#ioco-main-content') );
          });
        });
      });
    }
};

ioco.mainHeight = function(){ return $(window).height() - 70 };

ioco.hideSidebar = function(){ 
  ioco.menubar.animate({ left: '-40%' }); 
  $('#ioco-main-content').animate({ left: 0 });
};

ioco.loaderHtml = '<div class="loader"><div class="circle" /><div class="circle" /><div class="circle" /><div class="circle" /><div class="circle" /></div>';

ioco.setupTranslations = function setupTranslations(){
  $('.i18n').each( function(){
    $(this).text( $.i18n.t($(this).attr('data-i18n')) );
  });
};

ioco.setupAjaxHelpers = function setupAjaxHelpers(){
  
  $(document).bind("ajaxSend", function(e, req){})
  .bind("ajaxError", function(e, xhr){
    if( [401,403,304].indexOf( xhr.status ) >= 0 && location.href.indexOf('/login') < 0 )
      location.replace('/login');
    else if( xhr.status === 0 )
      ioco.notify({error: ['You are offline!!\n Please Check Your Network.']});
    //else if( xhr.status === 404 )
    //  ioco.notify('Destination target could not be found', true);
    else if( xhr.status === 500 )
      ioco.notify('Unexpected server error - We have been notified!', 'error');
    else if( e === 'parsererror' )
      ioco.notify('Error.\nParsing JSON Request failed.', 'error');
    else if( e === 'timeout' )
      ioco.notify('Request Time out.', 'error');
  });
  $('.ajax-button').live('click', function(){
    $(this).addClass('want-to-load-ajax');
  });

  $('form[data-remote=true]').live('submit', function(e){
    e.preventDefault();
    var data = $(this).serializeArray();
    data.push({name: '_csrf', value: $('#_csrf').val() });
    $.ajax({ url: $(this).attr('action'),
         dataType: 'script',
         data: data,
         error: function( data, msg, err ){
          console.log('error', err );
         },
         type: $(this).attr('method') });
  });

  $('a[data-remote=true]').live('click', function(e){
    e.preventDefault();
    var elem = this;
    ioco.ajaxLoad( this );
  });

  $(document).on('click', 'a[data-link=true]', function(e){
    location.hash = $(this).attr('href');
  });

  $(window).on( 'hashchange', ioco.loadRemoteAfterHashChange );

};

/**
 * check for hash in url and eventually
 * reload the page
 */
ioco.loadRemoteAfterHashChange = function loadRemoteAfterHashChange(){

  if( ioco.ignoreHashChange ){
    ioco.ignoreHashChange = false;
    return;
  }

  ioco.menubar.clearActive();


  var urlarr = location.hash.substring(1).split('?')
    , pararr
    , params = {}
    , url = urlarr[0]
    , appIcn = $('#ioco-menubar a[href="'+url+'"]');

  if( appIcn.length ){
    ioco.menubar.load( appIcn.closest('li'), url );
    return;
  }

  if( urlarr.length > 1 )
    pararr = urlarr[1].split('&');

  if( pararr && pararr.length > 0 )
    for( var i=0, param; param=pararr[i]; i++ ){
      if( param.split('=').length === 2 )
        params[param.split('=')[0]] = param.split('=')[1];
    }

  ioco.advancedPanel.hide();
  $('#ioco-dashboard').hide();
  url = url + ( urlarr.length > 1 ? '?'+urlarr[1] : '' );
  if( params.app )
    ioco.menubar.load( $('#app-icn-'+params.app), url );
  else
    ioco.main.load( url );

};

/**
 * add a notification message to the
 * notification system
 */
ioco.notify = function notify( msg, type ){
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
 * to the user.
 * * url: remote url, if this modal should be loaded from url
 * 
 * @param {Function} [callback] the callback that should be triggered
 * after modal has been rendered.
 *
 * @example
 *  ioco.modal('close')
 * closes the modal.
 */
ioco.modal = function( html, options ){

  function closeModal(){
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
    $('#ioco-modal .modal-inner-wrapper').html( html ).fadeIn(200);
    if( options && options.before && typeof(options.before) === 'function' )
      options.before( $('#ioco-modal') );
    setupModalActions();
  }

};

ioco.ajaxLoad = function( elem ){
  var method = $(elem).attr('data-method') || 'get'
    , data = null;
  if( $(elem).attr('data-method') && $(elem).attr('data-method') !== 'get' )
    data = {_csrf: $('#_csrf').val()};
    $.ajax({ url: $(elem).attr('href'),
         dataType: 'script',
         type: method,
         data: data
    });
};

ioco.fineUploaderText = function fineUploaderText(){
  return {
    uploadButton: '<i class="icn icn-upload pull-left"></i> <span class="pull-left">'+$.i18n.t('files.select')+'</span>',
    cancelButton: 'Cancel',
    retryButton: 'Retry',
    failUpload: 'Upload failed',
    dragZone: $.i18n.t('files.drag_here_to_upload'),
    formatProgress: "{percent}% of {total_size}",
    waitingForResponse: "Processing..."
  }
};

ioco.advancedPanel = {

  show: function(){
    $('#ioco-advanced-panel').slideDown({ easing: 'easeOutBounce', duration: 500 });
    $('#click-here-for-advanced .adv-close').show();
    $('#click-here-for-advanced .adv-open').hide();
    setTimeout( function(){
      $('#ioco-advanced-panel .query input').focus();
    }, 500)
  },

  hide: function(){
    $('#ioco-advanced-panel').slideUp(200);
    $('#click-here-for-advanced .adv-close').hide();
    $('#click-here-for-advanced .adv-open').show();
  }
};

$(function(){


  ioco.host = {
      native: document.location.protocol+'//'+document.location.host,
      master: $('#_host_master').val()
  };

  ioco.socket = {
      native: document.location.protocol+'//'+document.location.host,
      master: $('#_host_master').val()
  };

  ioco._csrf = $('#_csrf').val();

  $.i18n.init({ dynamicLoad: true, useLocalStorage: false, fallbackLng: 'de', load: 'unspecific', resGetPath: ioco.host.native+'/translations.json?lng=__lng__&ns=__ns__' });

  $('.live-tipsy').tooltipster();
  $('.live-tipsy-l').tooltipster({position: 'left'});
  $('.live-tipsy-r').tooltipster({position: 'right'});

  moment.lang('de');

/*
  $('body').tooltip({
    selector: '[rel=tooltip]'
  }).on('click', function(){
    $(this).find('div.tooltip').remove();
  }).on('keydown', function(e){
    // ESC
    if ( e.keyCode === 27 ){
      $('.ioco-modal').fadeOut(300);
      setTimeout( function(){
        $('.ioco-modal').remove();
      },300);
    }
  });
  */
  $(document).on('click', function(e){
    if( !$(e.target).closest('.dropdown').length )
      $('.dropdown-menu').hide();
    if( !$(e.target).hasClass('js-remove-on-click-trigger') &&
        !$(e.target).closest('.js-remove-on-click-trigger').length &&
        !$(e.target).hasClass('js-remove-on-click') && 
        !$(e.target).closest('.js-remove-on-click').length )
      $('.js-remove-on-click').remove();
    if( !$(e.target).hasClass('ioco-advanced-panel') &&
        !$(e.target).closest('.ioco-advanced-panel').length &&
        !$(e.target).closest('#ioco-top-panel').length )
      ioco.advancedPanel.hide();
    $('.tipsy').remove();
  }).on('keydown', function(e){
    if( e.keyCode === 27 ){ // ESC
      ioco.modal('close');
      ioco.advancedPanel.hide();
      return false;
    }
    if( (e.ctrlKey || e.metaKey) && e.keyCode === 70 ){ // CTRL-f
      ioco.advancedPanel.show();
      return false;
    }
  })

  $('#click-here-for-advanced').on('click', function(e){
    if( $('#ioco-advanced-panel').is(':visible') )
      ioco.advancedPanel.hide();
    else
      ioco.advancedPanel.show();
  });

  $('#ioco-top-panel .dashboard').on('click', function(e){
    $('#ioco-main-content').hide();
    ioco.menubar.clearActive();
    $('#ioco-menubar .desc').fadeIn(200);
    $('#ioco-dashboard').fadeIn(200);
  });

  /*
  $('#ioco-advanced-panel').on('mouseleave', function(e){
    if( $(e.target).hasClass('ioco-top-panel') || $(e.target).closest('.ioco-top-panel').length )
      return;
    $(this).slideUp(200);
  })
*/

  $('.js-get-focus:first').focus();

  if( ioco.mode === 'desktop' ){
    $('#desktop-control').show();
    $(document).on('keydown', function(e){
      if( e.metaKey && e.keyCode === 82 )
        location.reload();
      if( e.metaKey && e.keyCode == 87 )
        window.close();
    })
  }

  if( ioco.menubar )
    ioco.menubar.init();
  ioco.setupAjaxHelpers();

  ioco.usersCache = {};
  $.getJSON( '/users/friends.json?include_self=true', function( response ){
    if( response.success )
      for( var i in response.users )
        ioco.usersCache[response.users[i]._id] = response.users[i];
  });

  if( location.hash.length > 0 )
    ioco.loadRemoteAfterHashChange();

});