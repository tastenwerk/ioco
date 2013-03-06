/*
 * ioco - lib/db/plugins/versioning_idiom
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../index' );

/**
 * a version schema defines
 * holds a copy of this document and additional information
 */
var VersionSchema = new db.Schema({
  _createdBy: { type: db.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  data: { type: db.Schema.Types.Mixed }
});


var VersioningIdiomPlugin = function VersioningIdiomPlugin( schema, options ){

  schema.add({
    versions: [VersionSchema],
    deletedAt: { type: Date, default: null }
  });

  /**
   * trash a document
   *
   * mark the document deleted
   * with the mine operator
   * it won't show up in the results any more
   *
   * @param {function(callback)} [optional] if passed, save operation will be performend
   * and callback passed to it.
   *
   * can only be found with the trashed operator
   */
  schema.method('trash', function( callback ){
    this.deletedAt = new Date();
    if( typeof(callback) === 'function' )
      this.save( callback );
  });

  /**
   * restore a document
   *
   * removes 'deletedAt' switch from document
   *
   * @param {function(callback)} [optional] if passed, save operation will be performend
   * and callback passed to it.
   *
   */
  schema.method('restore', function( callback ){
    this.deletedAt = null;
    if( typeof( callback ) === 'function' )
      this.save( callback );
  });

}

module.exports = exports = VersioningIdiomPlugin;