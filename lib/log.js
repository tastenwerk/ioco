/*
 * ioco - lib/log
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */
var colors = require('colors');

/**
 * write a message as info to the syslog
 * checks if log level is on 'info' otherwise
 * ignores the given message
 *
 * @param {String,[String, [String]]} [args] log args
 * takes as many as provided
 */
function writeInfoLog(){
  var args = Array.prototype.slice.call(arguments);
  if( this._level > log.level.INFO )
    return;
  console.log.apply( this, [ '[ioco]'.yellow, 'INFO'.green].concat( args ) );
}

/**
 * write a message as warn to the syslog
 * checks if log level is on 'info' otherwise
 * ignores the given message
 *
 * @param {String,[String, [String]]} [args] log args
 * takes as many as provided
 */
function writeWarnLog(){
  var args = Array.prototype.slice.call(arguments);
  if( this._level > log.level.WARN )
    return;
  console.log.apply( this, [ '[ioco]'.yellow, 'WARN'.yellow].concat( args ) );
}

/**
 * write a message as error to the syslog
 * checks if log level is on 'info' otherwise
 * ignores the given message
 *
 * @param {String,[String, [String]]} [args] log args
 * takes as many as provided
 */
function writeErrorLog(){
  var args = Array.prototype.slice.call(arguments);
  if( this._level < log.level.ERROR )
    return;
  console.log.apply( this, [ '[ioco]'.yellow, 'ERROR'.red].concat( args ) );
}

/**
 * write a message as error to the syslog
 * and throw the same message (formatted as an error)
 *
 * @param {String,[String, [String]]} [args] log args
 * takes as many as provided
 */
function throwErrorLog(){
  var args = Array.prototype.slice.call(arguments);
  if( this._level < log.level.ERROR )
    console.log.apply( this, [ '[ioco]'.yellow, 'ERROR'.red].concat( args ) );
  throw new Error( args.join(' ') );
}

var log = {

  level: {
    INFO: 3,
    WARN: 2,
    ERROR: 1,
    QUIET: 0
  },

  _level: 3,

  info: writeInfoLog,
  warn: writeWarnLog,
  error: writeErrorLog,
  throwError: throwErrorLog,

  setLevel: function( level ){
    this._level = level;
  }

}

module.exports = exports = log;