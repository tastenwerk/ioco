/*
 * ioco - app/models/label
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require( __dirname + '/../lib/ioco' );

process.env.NODE_ENV = 'test';

var testHelper = {

  /**
   * initialize users
   * and populate this object
   */
  setupUser: function setupUser( obj, done ){

    var setup = {};
    setup.User = ioco.db.model( 'User' );

    setup.User.remove( function( err ){

      setup.User.create( {name: {nick: 'henry'}, password: 'henry', email: 'henry@v.com'}, function( err, user ){
        setup.userA = user;
        setup.User.create( {name: {nick: 'john'}, password: 'john', email: 'john@v.com'}, function( err, user ){
          setup.userB = user;
          done( setup );
        });
      });

    });

  },

  /**
   * setup a test app
   * object
   *
   * @returns {Express Application Object}
   *
   */
  setupApp: function setupApp(){

    var express = require('express')
      , app = express()
      , http = require('http')
      , path = require('path')
      , fs = require('fs')
      , stylus = require('stylus')
      , ioco = require('ioco')

    app.set('port', 8999);

    var server = require('http').createServer(app);

    ioco.db.open( 'mongodb://localhost:27017/ioco_tastenwerk_com' );
    ioco.initModels();

    //server.listen(app.get('port'));

    app.configure(function(){

      // use app's static files and routes first
      app.use( stylus.middleware( __dirname + '/public' ) );
      app.use( express.static( __dirname + '/public' ) );

      ioco.inject( express, app ); // inject app with ioco defaults and plugins

      app.use(express.methodOverride());
      app.use(app.router);
      app.use(express.errorHandler());

    });

    this.app = app;

    return app;

  },

  startWebServer: function startWebServer(){

    var app = this.app;

    var server = require('http').createServer(app)
    server.listen(app.get('port'), function(){
      ioco.log.info('ioco server listening on port ' + app.get('port'));
    });
    
  }

}

module.exports = exports = testHelper;