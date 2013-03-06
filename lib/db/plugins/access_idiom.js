/*
 * ioco - lib/db/plugins/access_control
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../index' )
  , log = require( __dirname + '/../../log');

/**
 * an acl schema defines
 * privileges for the user
 * and holds information about what object
 * and who is responsible for this very entry
 */
var AccessSchema = new db.Schema({
  _user: { type: db.Schema.Types.ObjectId, ref: 'User' },
  _createdBy: { type: db.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  _parentId: { type: db.Schema.Types.ObjectId },
  creator: { type: Boolean, default: false }
});


var VersioningIdiomPlugin = function VersioningIdiomPlugin( schema, options ){

  schema.add({ 
    access: { type: [AccessSchema], index: true },
    private: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  });

  /**
   * holder of this content object
   * there should never be an access to the
   * database without filling this virtual property
   *
   * @returns {User} - the holder user object
   *
   */
  schema.virtual('holder').get( function(){
    if( this._holder ){
      this._holder.loginLog = [];
      return this._holder;
    }
  });

  /**
   * set the holder of this content object.
   *
   * @param {User} - the user object to be holding this
   * content object
   */
  schema.virtual('holder').set( function( holder ){
    this._holder = holder;
  });

  /**
   * setup the creator's privileges
   */
  schema.pre( 'save', function setupCreatorPrivileges( next ){
    this.access[ this._holder._id ] = { creator: true, createdAt: new Date(), createdBy: this._holder._id };
    next();
  });

  /*
  schema.pre( 'save', accessControl.setupCreatorAndAccess );
  schema.pre( 'save', accessControl.syncChildren );
  schema.method('share', accessControl.share );
  schema.method('unshare', accessControl.unshare );
  schema.method('privileges', accessControl.privileges );
  schema.method('canRead', accessControl.canRead );
  schema.method('canWrite', accessControl.canWrite );
  schema.method('canShare', accessControl.canShare );
  schema.method('canDelete', accessControl.canDelete );
*/

}

module.exports = exports = VersioningIdiomPlugin;