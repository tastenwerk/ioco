var iomapper = require('iomapper')
  , fs = require('fs')
  , jade = require('jade');

// ioconal modules
var auth = require( __dirname + '/../auth' );

/**
 * the Folder model
 * is meant to help organizing
 * files and categorize them
 */

var FolderSchema = iomapper.mongoose.Schema({ color: String, settings: {type: iomapper.mongoose.Schema.Types.Mixed, default: {}}, })
FolderSchema.plugin( iomapper.plugin );
var Folder = iomapper.mongoose.model( 'Folder', FolderSchema );

var foldersPlugin = {

  disabled: true,

  models: {
    Folder: Folder
  },

  routes: function( app ){

    /*
     * renders folder view
     * or returns json
     *
     * js: renders the folders view (with a tree)
     *
     * json: returns a list of folders
     */
    app.get('/folders', auth.check, function( req, res ){

      res.format({

        html: function(){
          res.render( __dirname + '/views/index.jade' );
        },

        json: function(){
          var q = {}
          if( req.query._id )
            q = {paths: new RegExp('^'+req.query._id+':[a-zA-Z0-9]*$')};
            //q = {_id: iomapper.mongoose.Types.ObjectId( req.query._id ) };
          Folder.find(q).execWithUser( res.locals.currentUser, function( err, folders ){
            if( err ) return res.json({error: err});
            res.json( folders );
          });

        }

      });

    });

    /**
     * creates a new folder
     */
    app.post('/folders', auth.check, function( req, res ){

      req.body.folder.holder = req.user;
      var folder = new Folder( req.body.folder );
      folder.save( function( err ){
        console.log(err);
        err 
          ? req.flash('error', req.i18n.t('creation.failed') + ' ('+err+')')
          : req.flash('notice', req.i18n.t('creation.ok', {name: folder.name} ) );
        var f = folder.toJSON({getters: true});
        f.parentIds = folder.parentIds();
        res.render( __dirname + '/views/create.ejs', { flash: req.flash(), doc: f } );
      });
    });

    app.get('/folders/new', auth.check, function( req, res ){
      var partial = jade.compile( fs.readFileSync( __dirname + '/views/new.jade' ) );
      partial = partial({ folder: (new Folder({holder: res.locals.currentUser})).toJSON(), t: req.i18n.t });
      res.render( __dirname + '/views/new.ejs', { partial: partial } );
    });

    app.get('/folders/sidebar_content', auth.check, function( req, res ){
      res.render( __dirname + '/views/sidebar_content' );
    });

    app.get('/folders/:id', auth.check, getFolder, function( req, res ){
      var partial = jade.compile( fs.readFileSync( __dirname + '/views/show.jade' ) );
      partial = partial({ folder: req.folder, t: req.i18n.t });
      res.render( __dirname + '/views/show.ejs', { partial: partial, folder: req.folder } );
    })

  },

  sidebarWidget: {
    sidebarRemote: true
  }

}

function getFolder( req, res, next ){
  Folder.findById( req.params.id ).execWithUser( res.locals.currentUser, function( err, folder ){
    if( err )
      req.flash('error', req.i18n.t('not_found') );
    else
      req.folder = folder;
    next();
  })
}

module.exports = exports = foldersPlugin;