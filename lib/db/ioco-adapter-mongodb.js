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

/**
 * execWithUser
 *
 * execute a query with given user
 *
 * @param {User|String} - a User object or a string (will be understood as public)
 *
 * @param {Object} - an options object containing the user object from above
 *
 *
 * @example
 *
 * MyDocument.where({}).execWithUser( myUser, function( err, mydoc ){
 *  // do something with mydoc
 * });
 *
 * MyDocument.findById(myDocId).sort('createdAt').execWithUser( { holder: myUser, trashed: true }, function( err, mydoc ){
 *  // do something with mydoc
 * });
 */ 
mongoose.Query.prototype.execWithUser = function execWithUser( user, callback ){
  var options = { trashed: false };
  console.log('user', user);
  if( !user.name){
    for( var i in user )
      options[i] = user[i];
    user = user.holder;
  }
  console.log('user is', user);
  this.or( [ {public: true}, {'access._user': user._id} ] );
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