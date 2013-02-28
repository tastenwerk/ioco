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
  if( this._level > 0 )
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
  if( this._level > 1 )
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
  if( this._level > 2 )
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
  if( this._level > 2 )
    return;
  console.log.apply( this, [ '[ioco]'.yellow, 'ERROR'.red].concat( args ) );
  throw new Error( args.join(' ') );
}

var log = {

  level: {
    INFO: 0,
    WARN: 1,
    ERROR: 2,
    QUIET: 3
  },

  _level: 0,

  info: writeInfoLog,
  warn: writeWarnLog,
  error: writeErrorLog,
  throwError: throwErrorLog

}

module.exports = exports = log;