/*
 * ioco - app/models/label
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require( __dirname + '/../lib/ioco' );

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

  }

}

module.exports = exports = testHelper;