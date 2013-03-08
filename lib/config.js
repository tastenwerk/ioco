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

  site: {
    title: ''
  },
  
  // the database adapter to use
  db: {},

  // log file settings
  log: {
    level: 0
  },

  // session defaults
  session: {
    timeout: {
      mins: 10
    }
  },

  version: require( __dirname + '/version' )

};

var settingsFile = path.join( process.cwd(), 'config', 'settings.json' );

if( fs.existsSync( settingsFile ) ){
  var fileSettings = JSON.parse( fs.readFileSync( settingsFile ) );
  for( var i in fileSettings )
    settings[i] = fileSettings[i];
} else
  log.info( 'no configuration file found at', settingsFile );

if( settings.log && settings.log.level )
  log._level = settings.log.level;

module.exports = exports = settings;