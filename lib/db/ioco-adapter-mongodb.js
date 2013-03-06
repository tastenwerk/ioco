 /*
 * ioco-adapter-mongodb
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 * mongodb database connection adapter
 * for ioco cms
 *
 */

var mongoose = require( 'mongoose' );

var mongodbAdapter = {

  connect: function(){
    return mongoose.connect( Array.prototype.slice.call(arguments) )
  },

  logging: function( level ){
    if( level < 1 )
      mongoose.set('debug', true);
  },

  close: function( callback ){
    return mongoose.disconnect( callback );
  },

  Schema: mongoose.Schema,

  models: [],

  model: function(){
    if( arguments.length > 1 && this.models.indexOf( arguments[0] ) < 0 )
      this.models.push( arguments[0] );
    return mongoose.model.apply( mongoose, Array.prototype.slice.call(arguments) )
  },

  orig: mongoose

};

mongoose.Query.prototype.execWithUser = function execWithUser( user, callback ){
  var options = { trashed: false };
  if( !user.email ){
    for( var i in user )
      options[i] = user[i];
    user = user.holder;
  }
  this.or( [ {private: false}, {'access._user': user._id} ] );
  console.log( 'options', options );
  if( options.trashed )
    this.where('deletedAt').ne(null);
  else
    this.where('deletedAt').equals(null);
  this.exec( function( err, doc ){
    if( err )
      callback( err );
    else if( !doc )
      callback( null, null );
    else{
      if( doc instanceof Array )
        doc.map( function(d){ d.holder = user; });
      else
        doc.holder = user;
      callback( null, doc )
    }
  });
};

module.exports = exports = mongodbAdapter;