function DocumentBaseModel( self ){

  var hexDigits = new Array("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"); 

  //Function to convert hex format to a rgb color
  function rgb2hex(rgb) {
   rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
   return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }

  function hex(x) {
    return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
  }

  return {

    restrictedAttributes: ['_id', 'acl', 'createdAt', '_creator', '_updater', 'updatedAt', 'deletedAt', 'logs', '_type', 'paths' ],


    /**
     * returns a nice formatted date
     * of given date object
     *
     * @param {Date} [date] - the date to format
     * @param {Boolean} [human] - human friendly format (from now, until)
     */
    formattedDate: function formattedDate(date, human){
      date = typeof(self[date]) === 'function' ? self[date]() : self[date];
      if( typeof(human) === 'boolean' && human )
        return moment(date).fromNow();
      else if( human )
        return moment(date).format(human);
      else
        return moment(date).format('DD.MM.YYYY HH:mm');
    },

    t: function( text ){
      return $.i18n.t( text );
    },

    getUser: function( id ){
      if( id === 'a00000000000000000000000' )
        return { _id: 'a00000000000000000000000', name: { nick: $.i18n.t('anybody') } };
      return ioco.usersCache[ id ];
    },
    
    // -------------------------------------------------------- PUBLIC STATUS */
    /**
     * changes the public status and commits
     * status to server
     */
    changePublicStatus: function changePublicStatus( model, e ){
      $.ajax({ url: '/documents/'+self._id+'/change_public_status.json', 
                type: 'put',
                dataType: 'json',
                data: { _csrf: $('#_csrf').val() },
                success: function( data ){
                  if( data.success ){
                    self.published( data.published );
                    if( data.published )
                      $(e.target).removeClass('locked').text($.i18n.t('document.published'));
                    else
                      $(e.target).addClass('locked').text($.i18n.t('document.locked'));
                    ioco.notify( data.flash );
                  } else
                    ioco.notify({ error: $.i18n.t('document.publishing_failed_unknown')});
                }
      })
    },

    selColor: function selectColor( item, e ){
      var tmp = this.properties() || {};
      if( $(e.target).css('backgroundColor').length > 0 )
        tmp.selectedColor = rgb2hex( $(e.target).css('backgroundColor').toLowerCase() );
      else
        tmp.selectedColor = null;
      this.properties( tmp );
      $.ajax({ url: '/documents/'+self._id,
               type: 'put',
               dataType: 'json',
               data: { _csrf: ioco._csrf, doc: { properties: self.properties() } },
               success: function( json ){
                 if( !json.success )
                  ioco.notify( json.flash );
               }
      });
    },

    // -------------------------------------------------------- HUMAN readable PATH
    humanReadablePath: ko.observable(''),
    humanReadablePathTrunc: ko.observable(''),

    /*
     * load publicPath for this model
     * immediately
     */
    loadHumanReadablePath: function loadHumanReadablePath(){
      $.getJSON( '/documents/'+self._id+'/human_readable_path', function( data ){
        if( data.success ){
          self.humanReadablePath(data.humanReadablePath);
          if( self.humanReadablePath.length > 30 )
            self.humanReadablePathTrunc(self.humanReadablePath().substr(0,30));
          else
            self.humanReadablePathTrunc(self.humanReadablePath);
        } else
          ioco.notify( data.flash );
      });
    },

    isImage: function(){
      return ( self.contentType() && self.contentType().indexOf('image') === 0 );
    },

    saveName: function(){
    },

    renameItem: function(){
      var self = this;

      var $renameForm = $('<form class="content-padding" data-bind="submit: saveName"/>');
      $renameForm.append($('<p/>').append('<label>'+$.i18n.t('name')+'</label><br/>')
                .append('<input class="span-full" type="text" name="name" value="'+self.name()+'" /></p><p>')
                .append('<input class="btn pull-right" type="submit" value="'+$.i18n.t('rename')+'" /></p>'));

      ioco.prompt( $.i18n.t('document.rename', {name: self.name()}), $renameForm, {
        onSubmit: function( $modal, e ){
          var name = $modal.find('[name=name]').val();
          $.ajax({ url: '/documents/'+self._id,
                   data: { doc: { name: name },
                           _csrf: ioco._csrf },
                   type: 'put',
                   success: function( json ){
                      if( json.success ){
                        ioco.modal( 'close' );
                        self.name( name );
                      }
                      ioco.notify( json.flash );
                   }

          });
        }
      });
    },

    createComment: function(){
      return( new IocoComment( {content: ''}, self ));
    }


  }

}