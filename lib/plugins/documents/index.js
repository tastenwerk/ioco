/**
 *
 * documents (general CRUD operations)
 *
 */

var fs = require('fs')
  , path = require('path');

var ioco = require( __dirname + '/../../ioco' )
  , auth = require( __dirname + '/../auth' );

var documents = {

  /**
   * get a document by req.params.id
   *
   * @api public
   */
  get: function getDocument( req, res, next ){
    if( req.query._type && req.query._type.length > 0 )
      ioco.db.model(req.query._type).findById( req.params.id ).exec( function( err, doc ){
        req.doc = res.locals.doc = doc;
        next();
      });
    else
      ioco.db.findAnyByIdWithUser( res.locals.currentUser, req.params.id, function( err, doc ){
        req.doc = res.locals.doc = doc;
        next();
      });
  }

}
module.exports = exports = {
  
  documents: documents,

  routes: function( app ){


    app.get('/documents.json', auth.check, function( req, res ){
      var q = {}
      if( req.query.parentId )
        q = {paths: new RegExp('^'+req.query.parentId+':[a-zA-Z0-9]*$')};
      if( req.query.roots )
        q = {paths: []};
      if( req.query.nameLike )
        q = { name: new RegExp(req.query.nameLike) };
      ioco.db.findAnyWithUser( res.locals.currentUser, q, function( err, docs ){
        res.json( { success: err === null, data: docs, error: err } );
      });

    });

    app.put( '/documents/:id/change_public_status:format?', auth.check, documents.get, function( req, res ){
      res.format({
        json: function(){
          if( req.doc )
            if( req.doc.canWrite() ){
              if( req.doc.published )
                req.doc.publish(false);
              else
                req.doc.publish(true);
              req.doc.save( function( err ){
                if( err )
                  req.flash('error', err);
                else
                  if( req.doc.published )
                    req.flash('notice', req.i18n.t('document.has_been_published', {name: req.doc.name}));
                  else
                    req.flash('notice', req.i18n.t('document.has_been_locked', {name: req.doc.name}));
                res.json( { published: req.doc.published, success: (err === null), flash: req.flash() } );
              })
            } else {
              req.flash('error', req.i18n.t('security_transgression', {name: req.doc.name}))
              res.json( { published: req.doc.published, success: false, flash: req.flash() } );
            }
          else {
            req.flash('error', req.i18n.t('not_found') );
            res.json( { published: req.doc.published, success: false, flash: req.flash() } );
          }
        }
      });
    });

    app.get( '/documents/:id', auth.check, documents.get, function( req, res ){
      res.format({
        json: function(){
          res.json( req.doc );
        }
      });
    });

    /**
     * update any document
     */
    app.put('/documents/:id', auth.check, documents.get, function( req, res ){
      if( req.doc ){
        for( var i in req.body.doc )
          if( !i.match(/_id|createdAt|_creator|_updater|updatedAt|deletedAt|acl/) ){
            req.doc[i] = req.body.doc[i];
            if( typeof(req.doc[i]) === 'object' )
              req.doc.markModified( i );
          }
        if( typeof( req.doc.createVersion ) === 'function' )
          req.doc.createVersion();
        req.doc.save( function( err ){
          if( err )
            console.log(err);
          else
            req.flash('notice', req.i18n.t('saving.ok', {name: req.doc.name}));
          res.json({ success: (err === null), flash: req.flash() });
        });
      } else{
        req.flash('error', req.i18n.t('not_found') );
        res.json({ success: false, flash: req.flash() });
      }
    });

    app.get('/documents/:id/labels', auth.check, documents.get, function( req, res ){
      if( req.doc ){
        if( typeof(req.doc.labels) === 'function' )
          req.doc.labels( function( err, labels ){
            res.json( labels );
          });
        else
          res.json([])
      } else
        res.json([]);
    });

    app.post('/documents/:id/children', auth.check, documents.get, function( req, res ){
      if( req.doc ){
        for( var i in req.body._childrenIds )
          if( ! (req.body._childrenIds[i] in req.doc._childrenIds ) )
            req.doc.addChild( req.body._childrenIds[i] );
        for( var i in req.doc._childrenIds )
          if( ! (req.doc._childrenIds[i] in req.body._childrenIds ) )
            req.doc.removeChild( req.doc._childrenIds[i] );
        req.doc.save( function( err ){
          if( err )
            req.flash('error', err);
          res.json({ success: true, flash: req.flash() });
        });
      } else {
        req.flash('error', req.i18n.t('not_found') );
        res.json({ success: false, flash: req.flash() });
      }
    });

    app.delete('/documents/:id/labels/:labelId', auth.check, documents.get, function( req, res ){
      if( req.doc ){
       ioco.db.findAnyByIdWithUser( res.locals.currentUser, req.params.labelId, function( err, label ){
        if( err )
          req.flash('error', err);
        if( label ){
          req.doc.removeLabel( label );
          req.doc.save( function( err ){
            if( err )
              req.flash('error', err);
            else
              req.flash('notice', req.i18n.t('document.label_removed', {name: req.doc.name, label: label.name}));
            res.json({ success: true, flash: req.flash() });
          })
        } else {
          req.flash('error', req.i18n.t('not_found') );
          res.json({ success: false, flash: req.flash() });
        }

       }) 
      } else {
        req.flash('error', req.i18n.t('not_found') );
        res.json({ success: false, flash: req.flash() });
      }
    });

    app.delete('/documents/:id', auth.check, function( req, res ){

      ioco.db.findAnyByIdWithUser( res.locals.currentUser, req.params.id, function( err, doc ){
        if( err ){
          req.flash('error', err );
          res.json( {flash: req.flash() } );
        } else if( !doc ){
          req.flash('error', req.i18n.t('not_found') );
          res.json( {flash: req.flash() } );
        } else if( !doc.canDelete() ){
          req.flash('error', req.i18n.t('removeing.denied', {name: doc.name}) );
          res.json( {flash: req.flash() } );
        } else
          if( req.query.permanent )
            doc.remove( function( err ){
              if( err )
                req.flash('error', req.i18n.t('removing.permanent.failed', {name: doc.name}));
              else{
                req.flash('notice', req.i18n.t('removing.permanent.ok', {name: doc.name}));
                if( doc._type === 'File' )
                  fs.unlink( path.join( 'files', doc._id.toString().substr(11,2), doc._id.toString() ) );
              }
              res.json( { flash: req.flash(), success: ( err === null ) } );
            })
          else{
            doc.deletedAt = new Date();
            doc.save( function( err ){
              if( err )
                req.flash('error', req.i18n.t('removing.failed', {name: doc.name}));
              else
                req.flash('notice', req.i18n.t('removing.ok', {name: doc.name}) + ' ' + 
                  '<a href="/documents/'+doc._id+'/undo" data-remote="true" class="undo" data-method="post">' +
                  req.i18n.t('removing.undo') + '</a>');
              res.json( { flash: req.flash(), success: ( err === null ) } );
            });
          }
      });

    });

  }

}

// add document's view path to the global scope
ioco.view.paths.push( __dirname + '/views' );