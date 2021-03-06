var fs = require('fs')
  , ioco = require( __dirname + '/../../ioco' )
  , flash = ioco.flash
  , partial = require( __dirname + '/../../partial' )
  , moment = require('moment');

var defaultsPlugin = {

  middleware: function( app ){
    
    app.locals.ioco = { 
      config: ioco.config, 
      plugins: ioco.plugins
    },

    app.use( flash );
    app.use( partial );

    /**
     * set defaults middleware. This enables the defaults indexed array
     * to be used inside views
     */
    app.use( function setDefaults( req, res, next ){
      try{
        moment.lang(res.locals.currentUser.settings.locale);
      } catch(e){ moment.lang('de'); }

      // returns, if a plugin has defined allowedGroups and if the
      // currentUser is in one of the efined roles
      app.locals.ioco.pluginAllowed = function( plugin ){
        if( !res.locals.currentUser )
          return false;
        if( plugin.allowedGroups )
          return plugin.allowedGroups.some(function(el) { return res.locals.currentUser.groups.indexOf(el) > -1 });
        return true;
      };

      res.locals.moment = req.moment = moment;
      res.locals._csrf = req.session._csrf;
      res.locals._honeypot_csrf = require('crypto').createHash('sha1').update('ioco-honeypot').digest('hex');
      next();
    } );

  },

  routes: function( app ){

    app.get( '/translations.json', function( req, res ){
      var name = lang = req.query.lng;
      if( name.split(' ').length > 1 )
        name = lang = name.split(' ')[name.split(' ').length-1];
      res.json( getTranslationsStr( name, lang ) );
    });

    app.get( '/ioco-initial-setup', migrateVersions, function( req, res ){
      ioco.db.model('User').find({}, function( err, users ){
        if( users.length > 0 )
          return res.redirect( '/login' );
        req.flash();
        res.render( __dirname+'/views/initial-setup.jade', { flash: req.flash() } );
      });
    });

    app.post( '/ioco-initial-setup', function( req, res ){
      ioco.db.model('User').find({}, function( err, users ){
        if( users.length > 0 )
          return res.redirect( '/login' );
        ioco.db.model('User').create({ name: { nick: req.body.user.name },
                                       email: req.body.user.email || req.body.user.name + '@' + 'ioco.site',
                                       password: req.body.user.password,
                                       groups: [ 'manager', 'designer', 'editor' ] }, function( err, user ){
                                          if( err )
                                            req.flash('error', err);
                                          if( user ){
                                            req.flash('notice', req.i18n.t('initial_setup.done', {name: req.body.user.name}));
                                            return res.redirect('/login');
                                          }
                                          res.render( __dirname+'/views/initial-setup.jade' );
        })
      });
    });

  }

}

function migrateVersions( req, res, next ){

  // check version. set a version either in the database settings or
  // in a json file.

  if( 'version' === 'version' ){
  }
  next();

}

function getTranslationsStr( name, lang ){
  var tr = {};
  tr[lang] = {'translation': JSON.parse( fs.readFileSync( __dirname + '/../../../locales/'+name+'/translation.json' ) )};
  for( var i in ioco.plugins)
    if( ioco.plugins[i].translations ){
      var _tr = JSON.parse( fs.readFileSync( ioco.plugins[i].translations+'/'+name+'/translation.json' ) );
      for( var j in _tr )
        tr[lang]['translation'][j] = _tr[j];
    }
  return tr;
}

module.exports = exports = defaultsPlugin;