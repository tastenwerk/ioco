ioco.usersCache = ioco.usersCache || {};
/**
 * IO comment model
 */
IocoComment = function( attrs, parent, followsUp ){
  var self = this;
  self.createdAt = new Date();

  if( !attrs._id )
    console.log('i am new', attrs);
  $.extend( this, DocumentBaseModel(self) );

  self.comments = ko.observableArray([]);
  self.userId = ko.observable('');
  self.userName = ko.observable('');

  if( attrs.comments && attrs.comments.length > 0 )
    for( var i in attrs.comments )
      self.comments.unshift( new IocoComment( attrs.comments[i], parent, self ) );

  for( var i in attrs )
    if( i === 'comments' )
      continue;
    else if( !i.match(/_id|_user/) )
      self[i] = ko.observable(attrs[i]);
    else
      self[i] = attrs[i];

  self.saveComment = function( form ){
    console.log('posting myself', self);
    if( !self._id )
      $.ajax({ url: '/documents/'+parent._id+'/comments',
               type: 'post',
               data: { _csrf: $('#_csrf').val(),
                        comment: {
                          content: self.content()
                        },
                        follows_up: (followsUp ? followsUp._id : null)
                      },
               success: function( response ){
                if( response.success ){
                  self._user = response._user;
                  self.userId(response._user._id);
                  self.userName(response._user.name.full);
                  self._id = response.commentId;
                  ko.cleanNode($(form).parent().get(0));
                  if( followsUp ){
                    var formParent = $(form).parent();
                    followsUp.comments.unshift( self );
                    ko.applyBindings( followsUp, formParent.get(0) );
                    setTimeout( function(){
                      formParent.find('form').slideUp(200);
                    }, 50);
                  } else{
                    parent.comments.unshift( self );
                    ko.applyBindings( parent, $(form).parent().get(0) ) ;
                  }
                }
                ioco.notify( response.flash );
               }
      });
    else
      $.ajax({ url: '/documents/'+parent._id+'/comments/'+self._id,
              data: { _csrf: $('#_csrf').val(), comment: { content: self.content() } },
              type: 'put',
              success: function( response ){
                if( response.success ){
                  var elem = $(form).closest('.comment-item');
                  self.toggleCommentForm( elem );
                }
                ioco.notify( response.flash );

              }
      });
  };

  if( typeof(self._user) === 'object' ){
    self.userId(self._user._id);
    self.userName(self._user.name.full);
  } else if( typeof(self._user) === 'string' ) {
    if( ioco.usersCache[ self._user.toString() ] ){
      self.userId(ioco.usersCache[ self._user ]._id);
      self.userName(ioco.usersCache[ self._user ].name.full);
    } else
      $.getJSON( '/users/'+self._user, function( response ){
        if( response.success )
          ioco.usersCache[ self._user ] = response.user;
        self.userId(ioco.usersCache[ self._user ]._id);
        self.userName(ioco.usersCache[ self._user ].name.full);
      });
  }

  self.removeComment = function(){
    $.ajax({  url: '/documents/'+parent._id+'/comments/'+self._id,
              data: { _csrf: $('#_csrf').val() },
              type: 'delete',
              success: function( response ){
                console.log('parent comments', parent, parent.comments());
                if( response.success )
                  if( followsUp )
                    followsUp.comments.remove( self );
                  else
                    parent.comments.remove( self );
                ioco.notify( response.flash );
              } 
    });
  };

  self.toggleEditComment = function( obj, e ){
    self.toggleCommentForm( $(e.target).closest('.comment-item') );
  };

  self.toggleCommentForm = function( elem ){
    elem.find('.content-view').toggle();
    elem.find('.content-edit:first').slideToggle(200);
    setTimeout(function(){ elem.find('textarea').focus(); }, 200);
  };

  self.toggleFollowUpComment = function( obj, e ){
    var elem = $(e.target).closest('.comment-item');
    elem.find('.follow-up-form:first').slideToggle(200);
    setTimeout(function(){ elem.find('textarea').focus(); }, 200);
  };

  self.newFollowUp = function(){
    return new IocoComment( {content: ''}, parent, self );
  };

  self.simpleFormattedContent = ko.computed( function(){
    return self.content().replace(/\n/g, "<br />");
  });

}