var auth = require( __dirname + '/../auth' );

function formatValue( val ){
  if( typeof( val ) === 'string' )
    if( val.match(/true|yes|ja/) )
      return true;
    else if( val.match(/false|no|nein/) )
      return false;
    else if( val.match(/\d/) )
      return parseInt( val );
    else if( val.match(/[\d.,]+/) )
      return parseFloat( val.replace(',','.') );
  return val;
}

var preferencesPlugin = {

  routes: function( app ){

    app.get('/preferences', auth.check, function( req, res ){
      res.format({

        html: function(){
          res.render( __dirname + '/views/index.jade' );
        }

      });
    });

    app.get('/preferences/repair', auth.check, function( req, res ){
      req.user.preferences = { common: { locale: 'de', hosts: ['http://localhost:3000'] } };
      req.user.save( function( err ){
        if( err ) return res.send(err);
        res.json( res.locals.currentUser.preferences );
      });
    })

    app.post('/preferences', auth.check, function( req, res ){
      req.user.preferences = req.body.preferences
      for( var i in req.user.preferences )
        for( var j in req.user.preferences[i] )
          if( typeof( val ) === 'string' )
            req.user.preferences[i][j] = formatValue( req.user.preferences[i][j] );
          else if( typeof( req.user.preferences[i][j] ) === 'object' )
            if( req.user.preferences[i][j] instanceof Array )
              req.user.preferences[i][j].forEach( function( item ){
                item = formatValue( item );
              })
            else
              for( var k in req.user.preferences[i][j] )
                if( typeof( val ) === 'string' )
                  req.user.preferences[i][j] = formatValue( req.user.preferences[i][j] );
                else if( typeof( req.user.preferences[i][j] ) === 'object' )
                  if( req.user.preferences[i][j] instanceof Array )
                    req.user.preferences[i][j].forEach( function( item ){
                      item = formatValue( item );
                    })
      console.log('changed', req.user.preferences);
      req.user.markModified( 'preferences' );
      req.user.save( function( err ){
        if( err ) 
          req.flash('error', req.i18n.t('saving.failed', {name: req.i18n.t('preferences.title') }) + ' ('+err+')' );
        else
          req.flash('notice', req.i18n.t('preferences.saved') );
        res.render( __dirname + '/views/update.ejs', { flash: req.flash() } );
      })
    });

  }


}

module.exports = exports = preferencesPlugin;