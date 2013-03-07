var browserPlugin = {

  routes: function( app ){

    app.get('/tree_browser', function( req, res ){
      res.render( __dirname + '/views/index' );
    });

    app.get('/tree_browser/sidebar_content', function( req, res ){
      res.render( __dirname + '/views/sidebar.ejs' );
    });

  }

}

module.exports = exports = browserPlugin;