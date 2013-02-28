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

var url = require('url');

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

  if( config.get('db') && config.get('db').adapter )
    this.adapterName = config.get('db').adapter;
  else
    this.adapterName = 'ioco-adapter-'+uri.protocol.replace(':','');

  log.info('trying to load adapter', this.adapterName, 'for db connection');

  this.adapter = require( this.adapterName );
  this.Schema = this.adapter.Schema;
  this.model = this.adapter.model;
  this.adapter.open( dbPathUri );

}

var db = {

  connection: null,

  models: [],

  /**
   * open the connection by initializing
   * a ConnectionHandler
   */
  open: function openConnection( dbPathUri ){
    this.connection = new ConnectionHandler( dbPathUri );
    if( !this.connection.Schema )
      log.throwError('schema not implemented by chosen adapter! aborting');
    if( !this.connection.model )
      log.throwError('model not implemented by chosen adapter! aborting');
    this.Schema = this.connection.Schema;
    this.model = this.connection.model;
  }

};

module.exports = exports = db;