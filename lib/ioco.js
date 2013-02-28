/*
 * ioco
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 * content management system by TASTENWERK
 *
 */

var fs = require('fs');

var ioco = {

  /**
   * config (can be set via the config/settings.json file or on runtime)
   */
  config: require( __dirname + '/config' ),

  /**
   * returns the current version of ioco
   */
  version: JSON.parse( fs.readFileSync( __dirname + '/../package.json' ) ),

  /**
   * the connection to the database adapter
   */
  db: require( __dirname + '/db' )

};

module.exports = exports = ioco;