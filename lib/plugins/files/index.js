var ioco = require( __dirname + '/../../ioco' )
  , filetools = require( __dirname + '/tools' )
  , fs = require('fs')
  , path = require('path')
  , url = require('url')
  , jade = require('jade');

// ioconal modules
var auth = require( __dirname + '/../auth' )
  , streambuffer = require( __dirname + '/../../../lib/streambuffer');

var files = {
  getById: function getFileById( req, res, next ){
    ioco.db.model('File').findById( req.params.id ).execWithUser( res.locals.currentUser, function( err, file ){
      if( err )
        console.log('error:', err);
      req.file = res.locals.file = file;
      next();
    });
  }
};

var filesPlugin = {

  tools: filetools,

  files: files,
  
  routes: function( app ){
    
    /**
     * get files and images associated with
     * the given label
     *
     * @api public
     */
    app.get('/files/labeled_with/:label', auth.checkWithoutRedirect, function( req, res ){
      ioco.db.model('File').find({ _labelIds: req.params.label }).execWithUser( res.locals.currentUser || ioco.db.model('User').anybody, function( err, files ){
        if( err )
          console.log(err)
        res.json(files);
      });
    });

    /**
     * return an image file
     */
    app.get('/images/:id', auth.checkWithoutRedirect, function( req, res ){
      var user = res.locals.currentUser || ioco.db.model('User').anybody;
      var id = req.params.id.indexOf('.') > 0 ? req.params.id.split('.')[0] : req.params.id;

      if( id.match(/^[0-9a-fA-F]{24}$/) )

        ioco.db.model('File').findById( id ).execWithUser( user, function( err, file ){

          if( err ){
            console.log(err);
            return res.send(404);
          }

          if( file )

            res.format({

              html: function(){
                res.setHeader('Content-Type', file.contentType);
                res.sendfile( path.join( ioco.config.datastore.absolutePath, 'files', file.getFilePath() ) );
              },

              json: function(){
                res.json(file);
              }

            });

          else
            res.send(404);

        });
      else
        res.send(404);
    });

    /**
     * catch anything starting with files
     */
    app.get('/files/:id*', auth.checkWithoutRedirect, function( req, res ){
      var user = res.locals.currentUser || ioco.db.model('User').anybody;
      console.log( req.params.id );
      console.log( req.params.id.match(/^[0-9a-fA-F]{24}$/) );
      if( req.params.id.match(/^[0-9a-fA-F]{24}$/) )
        ioco.db.model('File').findById( req.params.id ).execWithUser( user, function( err, file ){
          if( err ) return res.send(404);
          if( file ){
            res.setHeader('Content-Type', file.contentType);
            res.sendfile( path.join( ioco.config.datastore.absolutePath, 'files', file._id.toString().substr(11,2), file._id.toString(), 'orig' ) );
          }
          else
            findFileByNameAndAncestors( user, req, res );
        });
      else
        findFileByNameAndAncestors( user, req, res );
    });

    app.get('/upload', auth.check, function( req, res ){
      var partial = jade.compile( fs.readFileSync( __dirname + '/views/new.jade' ) );
      partial = partial({ t: req.i18n.t });
      res.render( __dirname + '/views/new.ejs', { partial: partial } );      
    });

    app.post('/files', streambuffer, auth.check, function( req, res ){

      filetools.upload( req, res.locals.currentUser, req.body.dimensions || null, function( err, file ){
        res.json( file );
      });

    });

    /**
     * DELETE /files/:id
     *
     * delete selected file
     *
     * @api public
     */
    app.delete( '/files/:id', auth.check, files.getById, function( req, res ){
      if( req.file && req.file.canDelete() )
        req.file.remove( function( err ){
          if( err )
            console.log(err);
          res.json( err );
        })
      else
        res.json( { error: [ req.i18n.t('insufficient_rights') ] } );
    });

  }

};

function findFileByNameAndAncestors( user, req, res ){
  var paths = req.url.replace('/files/','').split('/');
  ioco.db.model('File').find({ name: paths[paths.length-1] }).execWithUser( user, function( err, files ){
    if( files.length === 1 ){
      res.setHeader('Content-Type', files[0].contentType);
      res.sendfile( path.join( ioco.config.datastore.absolutePath, 'files', files[0]._id.toString().substr(11,2), files[0]._id.toString(), 'orig' ) );
    } else
      ioco.db.firstAnyWithUser( user, { name: paths[0], paths: [] }, function( err, doc ){
        if( err ){ console.log(err); return res.send(500) }
        if( doc ){
          for( var i=0,file; file=files[i]; i++ )
            for( var j=0,filePath; filePath=file.paths[j]; j++ )
              if( filePath.indexOf( doc._id.toString() ) >= 0 ){
                res.setHeader('Content-Type', files[0].contentType);
                return res.sendfile( path.join( ioco.config.datastore.absolutePath, 'files', file._id.toString().substr(11,2), file._id.toString(), 'orig' ) );
              }
          res.send(404);
        } else
          res.send(404);
      });
  });
}

module.exports = exports = filesPlugin;