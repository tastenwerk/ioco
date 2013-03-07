var fs = require('fs')
  , config = JSON.parse( fs.readFileSync( process.cwd() + '/config/ioco.json' ) )
  , flash = require( __dirname + '/../../flash' )
  , partial = require( __dirname + '/../../partial' )
  , moment = require('moment')
  , ioco = require( __dirname + '/../../../index' );

config.version = JSON.parse( fs.readFileSync( __dirname+'/../../../package.json' ) ).version;

var defaultsPlugin = {

  middleware: function( app ){

    ioco.config = config,
    
    app.locals.ioco = { 
      config: config, 
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

      // returns, if a plugin has defined allowedRoles and if the
      // currentUser is in one of the efined roles
      app.locals.ioco.pluginAllowed = function( plugin ){
        if( !res.locals.currentUser )
          return false;
        if( plugin.allowedRoles )
          return plugin.allowedRoles.some(function(el) { return res.locals.currentUser.roles.indexOf(el) > -1 });
        return true;
      };

      res.locals.moment = req.moment = moment;
      res.locals._csrf = req.session._csrf;
      next();
    } );

  },

  routes: function( app ){

    app.get( '/translations.json', function( req, res ){
      var name = lang = req.query.lng;
      if( name.split(' ').length > 1 )
        name = lang = name.split(' ')[name.split(' ').length-1];
      var tr = {};
      tr[lang] = {'translation': JSON.parse( fs.readFileSync( __dirname + '/../../../locales/'+name+'/translation.json' ) )};
      for( var i in ioco.plugins)
        if( ioco.plugins[i].translations ){
          var _tr = JSON.parse( fs.readFileSync( ioco.plugins[i].translations+'/'+name+'/translation.json' ) );
          for( var j in _tr )
            tr[lang]['translation'][j] = _tr[j];
        }
      res.json( tr );
    });

  }

}

module.exports = exports = defaultsPlugin;