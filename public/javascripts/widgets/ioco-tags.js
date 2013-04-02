/**
 * IOtags
 * transforms input field into a nice tag selector
 *
 */

$(function(){

  $.fn.ioTags = function ioTags( options ){

    var self = this;

    function appendTag( tag ){
      $(self).before($('<span/>').append($('<span/>').addClass('tag-content').text(tag)).addClass('tag')
                      .append($('<span/>').addClass('remove-tag live-tipsy').html('&times;')
                        .attr('original-title', 'Diesen Tag löschen')));
    }

    if( $(self).hasClass('taggified') )
      return;

    $(self).addClass('taggified');

    var tags = $(self).val().split( options.separator || ',' );
    for( var i=0, tag; tag=tags[i]; i++ )
      appendTag( tag );

    $(self).val('');

    $(self).on('keydown', function(e){
      if( e.keyCode === 13 ){ // enter
        appendTag( $(this).val() );
        $(this).val('');
      }
    })
    $(self).parent().parent().on('click','.remove-tag', function(e){
      $(this).closest('.tag').remove();
      e.preventDefault();
      e.stopPropagation();
    });

  };

});
