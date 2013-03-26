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
  _lockedBy: { type: db.Schema.Types.ObjectId, ref: 'User' },
  lockedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  data: { type: db.Schema.Types.Mixed },
  comment: String,
  revision: { type: Number },
  active: { type: Boolean, default: false }
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

  /**
   * set version attributes
   *
   * @param {Array} [attrs] - a list of attributes to be considered
   * for versioning
   */
  schema.statics.setVersionAttrs = function setVersionAttrs( attrs ){
    this.versionAttrs = attrs;
  }

  /**
   * create a new version
   *
   * @param {Object} [options] - available options are:
   * * comment: {String} - a comment to be stored with this version
   *
   *
   */
  schema.method('createVersion', function( options ){

    options = options || {};

    var revision = 0;

    if( this.versions.length > 0 ){
      var sortedVersions = this.versions.reverse().sort(function(a,b){
        if( a.revision < b.revision )
          return 1;
        if( a.revision > b.revision )
          return -1;
        return 0;
      });

      revision = sortedVersions[0].revision+1;
    }

    var version = { _createdBy: this._holder || null,
                    data: {},
                    comment: options.comment || null,
                    revision: revision };

    if( !this.constructor.versionAttrs )
      throw new Error('no versionAttrs defined. Please define for your model using Model.setVersionAttrs({ your: attrs }); ');

    for( var i=0,attr;attr=this.constructor.versionAttrs[i];i++ )
      version.data[attr] = this[attr];

    this.versions.push( version );
    this.markModified('versions');

  });

  /**
   * restores a version
   *
   * @param {Number} [idx] - index of version to be restored
   * @param {Object} [object] - the object
   *
   */
  schema.method('switchVersion', function( idx, options ){
    options = options || {};

    if( options.saveCurrent )
      this.createVersion();

    if( this.versions.length >= idx )
      for( var i in this.versions[idx].data )
        this[i] = this.versions[idx].data[i] || null;
  });

}

module.exports = exports = VersioningIdiomPlugin;