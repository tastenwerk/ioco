/**
 * sidebar widget
 * adds actions to the ioco-menubar on the left hand side
 */

ioco = typeof(ioco) !== 'undefined' && ioco || {};

ioco.menubar = {

  load: function( iconId, url ){
    this.elem.find('.desc').hide(200);
    this.clearActive();
    $(iconId).addClass('active loading')
      .find('img').hide().after('<div class="loader"><div class="circle"><div class="circle"><div class="circle"><div class="circle"><div class="circle"></div>');
    $(iconId).find('img').attr('src', $(iconId).find('img').attr('src').replace('96x96w','96x96g'));
    ioco.ignoreHashChange = true;
    setTimeout(function(){ ioco.ignoreHashChange = false; }, 500);
    location.hash = url;
    $('#ioco-dashboard').hide();
    ioco.mainContainer.load( url, function(){
      $('#ioco-main-container').show();
      $(iconId).find('.loader').remove().end().find('img').fadeIn(300);
      setTimeout( function(){ $(iconId).removeClass('loading'); }, 300 );
    });

  },

  clearActive: function(){
    $('#ioco-menubar .desc').fadeOut(200);
    var icn = this.elem.find('img.icon');
    icn.each( function(index, icn){
      $(icn).attr('src', $(icn).attr('src').replace('96x96g','96x96w'));
    });
    this.elem.find('.active').removeClass('active').removeClass('loading');
  },

  init: function(){

    this.elem = $('#ioco-menubar');

    $(ioco.menubar.elem).find('li').on('click', function(e){
      e.preventDefault();

      if( $(this).hasClass('spacer') )
        return;

      ioco.menubar.load( this, $(this).find('a').attr('href') )

    });

    //if( location.hash.length === 0 )
    //$(ioco.menubar.elem).find('li:first').click();

  }

};