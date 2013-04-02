// ioconal modules
var auth = require( __dirname + '/../auth' );

var dashboardPlugin = {

  routes: function( app ){

    app.get('/trash-basket', function( req, res ){
      res.render( __dirname + '/views/index' );
    });

  }

}

module.exports = exports = dashboardPlugin;