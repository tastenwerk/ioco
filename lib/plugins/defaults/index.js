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
          console.log('parsing file ', i, ioco.plugins[i].translations+'/'+name+'/translation.json' );
          var _tr = JSON.parse( fs.readFileSync( ioco.plugins[i].translations+'/'+name+'/translation.json' ) );
          for( var j in _tr )
            tr[lang]['translation'][j] = _tr[j];
        }
      res.json( tr );
    });

  }

}

module.exports = exports = defaultsPlugin;