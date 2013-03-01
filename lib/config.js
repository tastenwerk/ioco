/*
 * ioco - lib/config
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var fs = require('fs')
  , path = require('path');

var log = require( __dirname + '/log' );

var settings = {

  // the database adapter to use
  db: {},

};

var settingsFile = path.join( process.cwd(), 'config', 'settings.json' );

if( fs.existsSync( settingsFile ) ){
  var fileSettings = JSON.parse( fs.readFileSync( settingsFile ) );
  for( var i in fileSettings )
    settings[i] = fileSettings[i];
} else
  log.info( 'no configuration file found at', settingsFile );


var config = {

  set: function( key, value ){
    settings[key] = value;
  },

  get: function( key ){
    if( key )
      return settings[key];
    return settings;
  }

};

module.exports = exports = config;