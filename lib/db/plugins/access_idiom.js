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
  creator: { type: Boolean, default: false },
  privileges: { type: String, default: 'r' }
});


var VersioningIdiomPlugin = function VersioningIdiomPlugin( schema, options ){

  schema.add({ 
    access: { type: [AccessSchema], index: true, default: [] },
    public: { type: Boolean, default: false },
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
    return this._holder;
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
   * tell if this document is published
   * and can be read by anybody user
   */
  schema.virtual('published').get( function(){
    return this.canRead( db.model('User').anybody );
  })

  /**
   * setup the creator's privileges
   */
  schema.pre( 'save', function setupCreatorPrivileges( next ){
    if( this.isNew )
      this.access.push( {_user: this._holder._id, privileges: 'rwscd', creator: true, createdAt: new Date(), _createdBy: this._holder._id } );
    next();
  });

  /**
   * share this document with given user
   *
   * @param {User|ObjectId|String} - the user object or string or objectid
   *
   */
  schema.method( 'share', function share( user, privileges, parent ){
    var User = db.model('User');
    var userId = this._getStringifiedUserId( user );
    if( userId === User.anybodyId )
      throw new Error('not allowed to share with anybody user. use #publish() instead')
    else if( userId === User.everybodyId && !privileges.match(/r|rw/) )
      privileges = 'rw';
    if( privileges.indexOf('d') >= 0 )
      privileges = 'rwscd';
    this.access.push(
      { _user: userId,
        createdAt: new Date(),
        createdBy: this._holder._id,
        _parent: parent ? parent._id : null,
        privileges: privileges }
    );
    this.markModified('access');
    /*this.addNotification( new mongoose.models.Notification( 
        { message: 'sharing.ok_for', 
          affectedUserName: user.name.nick,
          _creator: this.holder,
          docName: this.name,
          read: Object.keys(this.acl),
          docId: this._id,
          docType: this.collection.name } 
      ) 
    );*/
    return this;
  });

  /**
   * publish a document
   *
   * @param {Boolean} [optional] false, if this doucment should be unpublished
   *
   */
  schema.method( 'publish', function publish( doPublish ){
    this.public = (typeof(doPublish) === 'undefined' || doPublish );
    return this;
  });

  /**
   * unshare this document for given user
   *
   * @param {User} - the user which should be removed from list
   *
   */
  schema.method( 'unshare', function unshare( user, parent ){
    var User = db.model('User');
    var userId = this._getStringifiedUserId( user );
    for( var i=0, access; access=this.access[i]; i++ )
      if( access._user.toString() === userId && access._parent === parent )
        this.access = this.access.slice( i, 1 );
    return this;
  })

  /**
   * returns if given user can read this document
   *
   * @param {User|String|ObjectId} - the user object or a string id to check for privileges
   *
   */
  schema.method( 'canRead', function canRead( user ){
    var userId = this._getStringifiedUserId( user );
    for( var i=0, access; access=this.access[i]; i++ )
      if( access._user.toString() === userId )
        return true;
    return false;
  });

  /**
   * returns if the given user can write this document
   *
   * @param {User|String|ObjectId} - ths user object or string id to check for privileges
   *
   */
  schema.method( 'canWrite', function canWrite( user ){
    var userId = this._getStringifiedUserId( user );
    for( var i=0, access; access=this.access[i]; i++ )
      if( access._user.toString() === userId && access.privileges.match(/w/) )
        return true;
    return false;
  });

  /**
   * returns if the given user can write this document
   *
   * @param {User|String|ObjectId} - ths user object or string id to check for privileges
   *
   */
  schema.method( 'canShare', function canShare( user ){
    var userId = this._getStringifiedUserId( user );
    for( var i=0, access; access=this.access[i]; i++ )
      if( access._user.toString() === userId && access.privileges.match(/s/) )
        return true;
    return false;
  });

  /**
   * returns if the given user can write this document
   *
   * @param {User|String|ObjectId} - ths user object or string id to check for privileges
   *
   */
  schema.method( 'canCreate', function canCreate( user ){
    var userId = this._getStringifiedUserId( user );
    for( var i=0, access; access=this.access[i]; i++ )
      if( access._user.toString() === userId && access.privileges.match(/c/) )
        return true;
    return false;
  });

  /**
   * returns if the given user can write this document
   *
   * @param {User|String|ObjectId} - ths user object or string id to check for privileges
   *
   */
  schema.method( 'canDelete', function canDelete( user ){
    var userId = this._getStringifiedUserId( user );
    for( var i=0, access; access=this.access[i]; i++ )
      if( access._user.toString() === userId && access.privileges.match(/^rwscd$/) )
        return true;
    return false;
  });

  /**
   * get user id from string, ObjectId or User object
   * and return the stringified id
   *
   */
  schema.method( '_getStringifiedUserId', function _getStringifiedUserId( user ){
    if( typeof( user ) === 'object' && user instanceof db.Schema.Types.ObjectId )
      return user.toString();
    if( typeof( user ) === 'object' && user.email )
      return user._id.toString();
    return user;
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