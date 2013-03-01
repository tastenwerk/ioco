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
    return mongoose.connect.apply( mongoose, Array.prototype.slice.call(arguments) )
  },

  Schema: mongoose.Schema,

  model: function(){
    return mongoose.model.apply( mongoose, Array.prototype.slice.call(arguments) )
  },

  orig: mongoose

};

module.exports = exports = mongodbAdapter;