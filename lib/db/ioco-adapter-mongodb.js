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

var sortArray = require( __dirname + '/../sort_array' );

var mongodbAdapter = {

  connect: function(){
    return mongoose.connect( Array.prototype.slice.call(arguments) )
  },

  logging: function( level ){
    if( level > 2 )
      mongoose.set('debug', true);
  },

  close: function( callback ){
    return mongoose.disconnect( callback );
  },

  Schema: mongoose.Schema,

  ObjectId: mongoose.Types.ObjectId,

  models: [],

  model: function(){
    if( arguments.length > 1 && this.models.indexOf( arguments[0] ) < 0 )
      this.models.push( arguments[0] );
    return mongoose.model.apply( mongoose, Array.prototype.slice.call(arguments) )
  },

  orig: mongoose,

  firstAnyWithUser: function( user, query, options, callback ){

    this.findAnyWithUser( user, query, options, function( err, res ){

      if( typeof( callback ) === 'undefined' ){
        if( typeof( options ) === 'undefined' )
          callback = query;
        else
          callback = options;
        options = null;
      }

      if( err )
        callback( err );
      else if( res.length > 0 )
        callback( null, res[0]);
      else
        callback( null, null );
    });
  },

  findAnyByIdWithUser: function( user, id, callback ){
    var count = 0;

    function findInNextModel(){
      if( Object.keys(mongoose.models).length > count )
        mongoose.model( Object.keys(mongoose.models)[count++] ).findById( id, function( err, doc ){
          if( err )
            return callback( err );
          if( doc ){
            doc._holder = user;
            return callback( null, doc );
          }
          findInNextModel();
        });
      else
        callback( null, null );
    }

    findInNextModel();

  },

  findAnyWithUser: function(user, query, options, callback ){

    var count = 0
      , childrenArr = []
      , self = this
      , resultsArr = []
      , childrenCount = 0
      , models = mongoose.models
      , collectionsLength = Object.keys(models).length;


    function runInitChild(){
      var item = childrenArr[childrenCount++];
      models[item._type].findById( item._id ).execWithUser( user, function( err, child ){
        if( child ){
          child.holder = user;
          resultsArr.push( child );
        }
        if( childrenCount < childrenArr.length )
          runInitChild();
        else
          callback( null, sortArray( resultsArr, options && options.sort ) );
      })
    }

    function runCallback(){
      if( ++count === collectionsLength )
        if( childrenArr.length > 0 )
          runInitChild();
        else
          callback( null, [] );
    }

    if( typeof( callback ) === 'undefined' ){
      if( typeof( options ) === 'undefined' )
        callback = query;
      else
        callback = options;
      options = null;
    }

    // setup query
    var q = {};
    if( query )
      for( var i in query )
        q[i] = query[i];

    for( var i in mongoose.connection.collections ){
      mongoose.connection.collections[i].find(q, function( err, cursor ){
        if( err ){
          callback( err );
          return;
        } else{
          cursor.toArray(function(err, items) {
            if( err ){
              callback( err );
              return;
            }
            items.forEach( function( item ){
              if( item._type )
                childrenArr.push( item );
            });
            runCallback();
          });
        }
      });
    }

  }

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
  if( !user.name){
    for( var i in user )
      options[i] = user[i];
    user = user.holder;
  }
  this.or( [ {public: true}, {'access._user': user._id} ] );
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