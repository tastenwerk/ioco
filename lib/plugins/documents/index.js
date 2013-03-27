/**
 *
 * documents (general CRUD operations)
 *
 */

var ioco = require( __dirname + '/../../ioco' )
  , path = require('path')
  , auth = require( __dirname + '/../auth' );

module.exports = exports = {
  
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

    app.put( '/documents/:id/change_public_status:format?', auth.check, getDocument, function( req, res ){
      res.format({
        json: function(){
          if( req.doc )
            if( req.doc.canWrite() ){
              if( req.doc.published )
                req.doc.unshare( ioco.db.model('User').anybody );
              else
                req.doc.share( ioco.db.model('User').anybody, 'r' );
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
            } else
              req.flash('error', req.i18n.t('security_transgression', {name: req.doc.name}))
          else
            req.flash('error', req.i18n.t('not_found') );
        }
      });
    });

    app.get('/documents/:id/human_readable_path', auth.check, getDocument, function( req, res ){
      if( req.doc ){
        req.doc.ancestors( function( err, ancestors ){
          if( err ) 
            req.flash( 'error', err );
          else{
            req.humanReadablePath = req.humanReadablePath || "";
            ancestors.forEach( function( anc ){
              req.humanReadablePath = path.join( req.humanReadablePath, anc.name );
            })
            req.humanReadablePath = path.join( req.humanReadablePath, req.doc.name );
          }
          res.json( { success: true, humanReadablePath: req.humanReadablePath } );
        })
      } else{
        req.flash('error', req.i18n.t('not_found'));
        req.json( { success: false, flash: req.flash() });
      }
    });

    app.get( '/documents/:id', auth.check, getDocument, function( req, res ){
      res.format({
        json: function(){
          res.json( req.doc );
        }
      });
    });

    app.post( '/documents/sort', auth.check, function( req, res ){
      var pos = 0
        , documents = [];
      function updateNextDocument(){
        documents[ pos ].pos = pos;
        console.log( req.body.path );
        if( req.body.path ){
          if( documents[pos]._labelIds.indexOf( req.body.path ) < 0 )
            documents[ pos ]._labelIds = [ req.body.path ];
        } else{
          console.log( 'nullifying ', documents[pos].name );
          documents[ pos ]._labelIds = [];
        }

        //documents[ pos ].markModified( '_labelIds' );
        console.log( documents[pos]._labelIds );

        documents[ pos ].save( function( err ){
          if( err ) return res.json( { success: false } );
          if( ++pos < documents.length )
            updateNextDocument();
          else{
            req.flash( 'notice', req.i18n.t('document.order.saving.ok') ); 
            res.json( { success: true, flash: req.flash() });
          }
        })
      }
      var ids = req.body.ids.split(',').map(function( item ){ return ioco.db.ObjectId( item ); });
      ioco.db.findAnyWithUser( res.locals.currentUser, { _id: {$in: ids} }, function( err, docs ){
        for( var i=0, id; id=ids[i]; i++ )
          for( var j=0, d; d=docs[j]; j++)
            if( d._id.toString() === id.toString() )
              documents.push( d )
        updateNextDocument();
      });
    });

    /**
     * update any document
     */
    app.put('/documents/:id', auth.check, getDocument, function( req, res ){
      if( req.doc ){
        for( var i in req.body.doc )
          if( !i.match(/_id|createdAt|_creator|_updater|updatedAt|deletedAt|acl/) ){
            req.doc[i] = req.body.doc[i];
            if( typeof(req.doc[i]) === 'object' )
              req.doc[i].markModified();
          }
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

    app.get('/documents/:id/labels.json', auth.check, getDocument, function( req, res ){
      if( req.doc ){
        if( typeof(req.doc.labels) === 'function' )
          req.doc.labels( function( err, labels ){
            res.json({ success: err === null, labels: labels });
          });
        else
          res.json({ success: true, labels: [] })
      } else {
        req.flash('error', req.i18n.t('not_found') );
        res.json({ success: false, flash: req.flash(), labels: [] });
      }
    });

    app.post('/documents/:id/labels/:labelId', auth.check, getDocument, function( req, res ){
      if( req.doc ){
       ioco.db.findAnyByIdWithUser( res.locals.currentUser, req.params.labelId, function( err, label ){
        if( err )
          req.flash('error', err);
        if( label ){
          req.doc.addLabel( label );
          req.doc.save( function( err ){
            if( err )
              req.flash('error', err);
            else
              req.flash('notice', req.i18n.t('document.labeled', {name: req.doc.name, label: label.name}));
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

    app.delete('/documents/:id/labels/:labelId', auth.check, getDocument, function( req, res ){
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

      ioco.db.firstAnyWithUser( res.locals.currentUser, { _id: ioco.db.Schema.Types.ObjectId( req.params.id ) }, function( err, doc ){
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
              else
                req.flash('notice', req.i18n.t('removing.permanent.ok', {name: doc.name}));
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

function getDocument( req, res, next ){
  ioco.db.findAnyByIdWithUser( res.locals.currentUser, req.params.id, 
    function( err, doc ){
      req.doc = doc;
      next();
  });
}