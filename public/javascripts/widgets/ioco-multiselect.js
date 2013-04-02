/**
 * IOtags
 * transforms input field into a nice tag selector
 *
 */

$(function(){

  $.fn.iocoMultiSelect = function iocoMultiSelect( options ){

    var searchCache = '';

    options = options || {};

    var $self = this
      , $msDiv = $('<div/>').addClass('ioco-multiselect');

    if( $self.hasClass('ioco-multiselect') )
      return;

    $('.ioco-dropdown').remove();

    function renderLabel( label ){
      if( typeof(options.labels) === 'function' )
        options.labels.push( label );
      return $('<label/>').append( $('<span/>').text(label.name) ).data('label', label)
            .append( $('<span/>').addClass('remove-label').html('&times;').on('click', function(e){
              var self = this;
              if( typeof(options.delete) === 'function' )
                options.delete( $(this).closest('label').data('label'), function(){
                  $(self).closest('label').remove();
                });
              else{
                if( typeof( options.labels ) === 'function' )
                  options.labels.remove( $(this).closest('label').data('label') );
                }
                $(this).closest('label').remove();
            })
          );
    }

    function createLabel( label ){
      if( typeof(options.save) === 'function' )
        options.save( label, function(){
          renderLabel( label ).insertBefore($addLabel);
        });
      else
        renderLabel( label );
    }

    if( options.labels && typeof(options.labels) === 'function' )
      options.labels().forEach( function( label ){
        $msDiv.append( renderLabel( label ) );
      });

    var $addLabel = $('<input type="text" class="add-label" />')
      .on('keydown', function( e ){
        if( e.keyCode === 13 ){
          if( $('.ioco-dropdown li.selected').length ){
            createLabel( $('.ioco-dropdown li.selected').data('label') );
            $(this).val('');
            $('.ioco-dropdown').remove();
          }
          return false;
        } else if( e.keyCode === 27 ){
          $('.ioco-dropdown').remove();
          $(this).val('');
          return false;
        }
        if( e.keyCode === 40 && searchCache.length > 0 ){
          if( $('.ioco-dropdown').find('li.selected').length )
            if( $('.ioco-dropdown').find('li.selected').next('li').length )
              $('.ioco-dropdown').find('li.selected').removeClass('selected').next('li').addClass('selected');
            else{
              $('.ioco-dropdown .selected').removeClass('selected');
              $('.ioco-dropdown').find('li:first').addClass('selected');
            }
          else
            $('.ioco-dropdown').find('li:first').addClass('selected');
          return;
        }
        if( e.keyCode === 38 && searchCache.length > 0 ){
          if( $('.ioco-dropdown').find('li.selected').length )
            if( $('.ioco-dropdown').find('li.selected').prev('li').length )
              $('.ioco-dropdown').find('li.selected').removeClass('selected').prev('li').addClass('selected');
            else{
              $('.ioco-dropdown .selected').removeClass('selected');
              $('.ioco-dropdown').find('li:last').addClass('selected');
            }
          else
            $('.ioco-dropdown').find('li:last').addClass('selected');
          return;
        }
        if( options.url ){

          $('.ioco-dropdown').remove();
          var newVal = $(this).val();

          if( searchCache.indexOf( newVal ) >= 0 ){
            $('.ioco-dropdown').find('li').show().each(function(){
              if( $(this).text().indexOf( newVal ) < 0 )
                $(this).hide();
            });
            return;
          }

          var $resultDropDown = $('<div/>').addClass('ioco-dropdown').append( $('<ul/>') )
              .css({top: $(this).offset().top+$(this).height(), left: $(this).offset().left})
              .on('click', 'li', function(e){
                renderLabel( $(this).data('label') ).insertBefore($addLabel);
                $addLabel.val('');
                $('.ioco-dropdown').remove();
              })
              .on('hover', 'li', function(e){
                $('.ioco-dropdown .selected').removeClass('selected');
                $(this).addClass('selected');
              });
          
          $('body').append( $resultDropDown );
          
          $.getJSON( options.url, { nameLike: $addLabel.val() }, function(json){
            if( json.success )
              for( var i in json.data )
                $resultDropDown.find('ul').append( $('<li/>').data('label', json.data[i]).text(json.data[i].name) );
          });

        }
        searchCache = newVal;
      });

    $msDiv.append( $addLabel )

    $self.replaceWith( $msDiv );

  };

});
