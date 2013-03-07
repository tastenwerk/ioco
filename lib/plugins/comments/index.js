/**
 *
 * comments (general CRUD operations)
 *
 */

var iomapper = require('iomapper')
  , path = require('path')
  , auth = require( __dirname + '/../auth' );

function getComment( doc, commentId ){
  var comment = doc.comments.id( commentId );
  if( comment )
    return comment;
  doc.comments.forEach( function( com ){
    var c = getComment( com, commentId );
    if( c )
      comment = c;
  });
  return comment;
}

module.exports = exports = {
  
  routes: function( app ){

    app.post( '/documents/:id/comments', auth.check, getDocument, function( req, res ){
      if( req.doc ){
        var commentDefault = req.body.comment;
        var commentId;
        commentDefault._user = res.locals.currentUser;
        if( req.body.follows_up ){
          var comment = getComment( req.doc, req.body.follows_up )
          comment.comments.unshift( commentDefault );
          commentId = comment.comments[ comment.comments.length-1 ]._id;
        } else{ 
          req.doc.comments.unshift( commentDefault );
          commentId = req.doc.comments[ req.doc.comments.length-1 ]._id;
        }
        req.doc.save( function( err ){
          if( err )
            req.flash('error', req.i18n.t('comments.posting.failed') );
          else
            req.flash('notice', req.i18n.t('comments.posting.ok') );
          res.json({ flash: req.flash(), success: (err===null), commentId: commentId, _user: res.locals.currentUser });
        });
      } else{
        req.flash('error', req.i18n.t('not_found'));
        res.json({ flash: req.flash(), success: false })
      }
    });

    app.put( '/documents/:id/comments/:commentId', auth.check, getDocument, function( req, res ){
      if( req.doc ){
        var comment = getComment( req.doc, req.params.commentId );
        if( comment._user.toString() === res.locals.currentUser._id.toString() || res.locals.currentUser.roles.indexOf('manager') >= 0 ){
          comment.updatedAt = new Date();
          comment.content = req.body.comment.content;
          req.doc.save( function( err ){
            if( err )
              req.flash('error', req.i18n.t('comments.saving.failed') );
            else
              req.flash('notice', req.i18n.t('comments.saving.ok') );
            res.json({ flash: req.flash(), success: (err===null)  });
          });
        } else {
          req.flash('error', req.i18n.t('insufficient_rights'));
          res.json({ flash: req.flash(), success: false }) 
        }
      } else {
        req.flash('error', req.i18n.t('not_found'));
        res.json({ flash: req.flash(), success: false })
      }
    });

    app.delete( '/documents/:id/comments/:commentId', auth.check, getDocument, function( req, res ){
      if( req.doc ){
        var comment = getComment( req.doc, req.params.commentId );

        if( comment._user.toString() === res.locals.currentUser._id.toString() || res.locals.currentUser.roles.indexOf('manager') >= 0 ){
          // comment.deletedAt = new Date(); // TODO: undo option!!!
          comment.remove();
          req.doc.save( function( err ){
            if( err )
              req.flash('error', req.i18n.t('comments.removing.failed') );
            else
              req.flash('notice', req.i18n.t('comments.removing.ok') );
            res.json({ flash: req.flash(), success: (err===null)  });
          });
        } else {
          req.flash('error', req.i18n.t('insufficient_rights'));
          res.json({ flash: req.flash(), success: false }) 
        }
      } else {
        req.flash('error', req.i18n.t('not_found'));
        res.json({ flash: req.flash(), success: false })
      }
    });

  }

}

// add document's view path to the global scope
ioco.view.paths.push( __dirname + '/views' );

function getDocument( req, res, next ){
  iomapper.firstAnyWithUser( res.locals.currentUser, { 
    _id: iomapper.mongoose.Types.ObjectId( req.params.id ) }, 
    function( err, doc ){
      req.doc = doc;
      next();
  });
}