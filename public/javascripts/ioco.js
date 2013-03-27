ioco.mainContainer = {
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

ioco.mainContainerHeight = function(){ return $(window).height() - 70 };

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

  $(document).on('submit', 'form[data-remote=true]', function(e){
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

  $(document).on('click', 'a[data-remote=true]', function(e){
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
    ioco.mainContainer.load( url );

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

  /**
   * knockout globals
   *
   */
  ioco.ko = {
    plainAttrsArr: [ '_id', '_type', 'access', 'createdAt', 'updatedAt', 'rootWebBitId' ],
    plainAttrsRegExp: function plainAttrsRegExp(){
      return new RegExp( this.plainAttrsArr.join('|') );
    }
  }

  ioco.parseTooltips = function(){
    $('.tooltip,.live-tipsy').tooltipster();
    $('.tooltip-l,.live-tipsy-l').tooltipster({position: 'left'});
    $('.tooltip-r,.live-tipsy-r').tooltipster({position: 'right'});
  }

  ioco._csrf = $('#_csrf').val();

  $.i18n.init({ dynamicLoad: true, useLocalStorage: false, fallbackLng: 'de', load: 'unspecific', resGetPath: ioco.host.native+'/translations.json?lng=__lng__&ns=__ns__' });

  ioco.parseTooltips();

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

  if( ioco.menubar )
    ioco.menubar.init();
  ioco.setupAjaxHelpers();

  ioco.usersCache = {};

  ioco.initUsersCache = function initUsersCache( callback ){
    if( Object.keys(ioco.usersCache).length )
      if( typeof(callback) === 'function' )
        callback( null, ioco.usersCache )
      else
        return;

    $.getJSON( '/users/friends.json?include_self=true', function( response ){
      if( response.success )
        for( var i in response.users )
          ioco.usersCache[response.users[i]._id] = response.users[i];
      if( typeof(callback) === 'function' )
        callback( null, ioco.usersCache );
    });
  }

  if( location.hash.length > 0 )
    ioco.loadRemoteAfterHashChange();

});