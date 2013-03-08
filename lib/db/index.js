/*
 * ioco - lib/db/index
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 * database connection handler
 *
 */

var url = require('url')
  , fs = require('fs')
  , path = require('path');

var log = require( __dirname+'/../log' )
  , config = require( __dirname+'/../config' );

/**
 * @class ConnectionHandler
 *
 * handles connection to given path uri
 *
 * an uri consists of the protocol handler
 * which maps to the database adapter (this
 * adapter needs to exist and refered in
 * package.json)
 *
 * @example
 *    new ConnectionHandler( 'dummy://mydb' )
 *
 * opens a new dummy database connection to
 * the build-in dummy database adapter (does nothing)
 */
function ConnectionHandler( dbPathUri ){

  var uri = url.parse( dbPathUri );

  this.adapterName = 'ioco-adapter-'+uri.protocol.replace(':','');

  // try with local path first
  var adapterLocalPath = path.join( __dirname, this.adapterName );
  if( fs.existsSync( adapterLocalPath + '.js' ) ){
    this.adapter = require( adapterLocalPath );
    log.info('loaded adapter', adapterLocalPath, 'for db connection');
  } else {
    // now try loading an external adapter
    this.adapter = require( this.adapterName );
    log.info('trying to load adapter', this.adapterName, 'for db connection');
  }
  this.Schema = this.adapter.Schema;
  this.model = this.adapter.model;
  this.models = this.adapter._models;
  this.close = this.adapter.close;
  log.info('connecting adapter to database:', dbPathUri);
  this.adapter.connect( dbPathUri );

}

var db = {

  connection: null,

  models: [],

  /**
   * open the connection by initializing
   * a ConnectionHandler
   *
   * @param {String} [dbPathUri] - a valid db uri (protocol part is for the adapter to be chosen)
   *
   */
  open: function openConnection( dbPathUri, callback ){
    if( this.connection )
      return;
    this.dbPathUri = dbPathUri;
    this.connection = new ConnectionHandler( dbPathUri );
    this.connection.adapter.logging( log._level );
    if( !this.connection.Schema )
      log.throwError('schema not implemented by chosen adapter! aborting');
    if( !this.connection.model )
      log.throwError('model not implemented by chosen adapter! aborting');
    this.Schema = this.connection.Schema;
    this.model = this.connection.model;
    if( typeof( callback ) === 'function' )
      callback();
  },

  close: function closeConnection( callback ){
    log.info('disconnecting from database', this.dbPathUri);
    this.connection.close( callback );
    this.connection = null;
  }

};

module.exports = exports = db;