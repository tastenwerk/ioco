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
 * an access schema defines
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


var AccessIdiomPlugin = function AccessIdiomPlugin( schema, options ){

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
    return this.canRead( db.model('User').anybodyId );
  })

  /**
   * setup the creator's privileges
   */
  schema.pre( 'save', function setupCreatorPrivileges( next ){
    if( this.isNew )
      setupCreatorAndAccessPrivileges.call( this, next );
    else
      next();
  });


  /**
   * performs an incremental update to child object
   * to syncronize their access with parent content
   */
  schema.pre('save', function _syncChildren( next ){

    if( this.isNew || !this.access || this.modifiedPaths().indexOf('access') < 0 )
      return next();

    var self = this
      , thisChildren = []
      , childrenCount = 0;

    function nextChild(){
      var child = thisChildren[ childrenCount ];
      for( var i in self.access){
        if( child.access[i] )
          child.access[i].privileges = self.access[i].privileges;
        else
          child.access[i] = { privileges: self.access[i].privileges, from: {} };
        if( child.access[i].from )
          child.access[i].from[self.id] = {privileges: self.access[i].privileges, createdAt: new Date() };
      }
      // check for dead bodies which should not exist after
      // parent's unsharing
      for( var i in child.access )
        if( !self.access[i] && child.access[i].from[self.id] && Object.keys(child.access[i].from).length === 1 )
          delete child.access[i];
      child.markModified('access');
      child.save( function( err ){
        if( err )
          next( err );
        else{
          if( ++childrenCount < thisChildren.length )
            nextChild();
          else
            next();
        }
      })
    }

    this.children( function( err, children ){
      thisChildren = children;
      if( err )
        next( err );
      else if( children.length === 0 )
        next();
      else
        nextChild();
    });

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
      privileges = 'r';
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
    //this.markModified('access');
    /*this.addNotification( new mongoose.models.Notification( 
        { message: 'sharing.ok_for', 
          affectedUserName: user.name.nick,
          _creator: this.holder,
          docName: this.name,
          read: Object.keys(this.access),
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
    if( doPublish )
      this.share( db.model('User').anybody, 'r' );
    else
      this.unshare( db.model('User').anybody );
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
        this.access.splice( i, 1 );
    //this.markModified('access');
    return this;
  });

  /**
   * return privileges for given user (or current document holder)
   *
   */
  schema.method( 'privileges', function privileges( user ){
    var userId = this._getStringifiedUserId( user || this._holder );
    for( var i=0, access; access=this.access[i]; i++ )
      if( typeof(access._user) !== 'undefined' && access._user.toString() === userId )
        return access.privileges;
  });

  /**
   * returns if given user can read this document
   *
   * @param {User|String|ObjectId} - the user object or a string id to check for privileges
   *
   */
  schema.method( 'canRead', function canRead( user ){
    return typeof(this.privileges( user )) !== 'undefined';
  });

  /**
   * returns if the given user can write this document
   *
   * @param {User|String|ObjectId} - ths user object or string id to check for privileges
   *
   */
  schema.method( 'canWrite', function canWrite( user ){
    if( this.privileges( user ) )
      return this.privileges( user ).match(/w/) !== null;
    return false;
  });

  /**
   * returns if the given user can write this document
   *
   * @param {User|String|ObjectId} - ths user object or string id to check for privileges
   *
   */
  schema.method( 'canShare', function canShare( user ){
    if( this.privileges( user ) )
      return this.privileges( user ).match(/s/) !== null;
    return false;
  });

  /**
   * returns if the given user can write this document
   *
   * @param {User|String|ObjectId} - ths user object or string id to check for privileges
   *
   */
  schema.method( 'canCreate', function canCreate( user ){
    if( this.privileges( user ) )
      return this.privileges( user ).match(/c/) !== null;
    return false;
  });

  /**
   * returns if the given user can write this document
   *
   * @param {User|String|ObjectId} - ths user object or string id to check for privileges
   *
   */
  schema.method( 'canDelete', function canDelete( user ){
    if( this.privileges( user ) )
      return this.privileges( user ).match(/d/) !== null;
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
    if( typeof( user ) === 'object' && user._id === db.model('User').anybodyId )
      return user._id;
    return user;
  });

}

/**
 * loads all path items and injects
 * this.access with found parent's access
 * overriding from last parent to first parent
 */
function setupCreatorAndAccessPrivileges( callback ){
  var parentsLength = this._labelIds.length
    , self = this;

  if( self._labelIds.length === 0 ){
    this.access.push( {_user: this._holder._id, privileges: 'rwscd', creator: true, createdAt: new Date(), _createdBy: this._holder._id } );
    return callback();
  }

  function nextParent(){

    var str = self._labelIds[--parentsLength]
      , arr = str.split(':');
    
    // lookup all labelIds
    self.db.model(arr[0]).findById(arr[1], function( err, parent ){
      if( err )
        callback( err );
      else {
        if( parent ){
          for( var i in parent.access ){
            if( ! self.access[i] || !self.access[i].privileges ){
              self.access[i] = parent.access[i];
              self.access[i].from = {};
            } else
              if( parent.access[i].privileges.length > self.access[i].privileges.length )
                self.access[i].privileges = parent.access[i].privileges;
            if( self.access[i].from )
              self.access[i].from[parent.id] = {privileges: parent.access.privileges, createdAt: new Date() };
          }
        }
        if( parentsLength > 0 )
          nextParent();
        else{
          // ensure creator has correct privileges set;
          self.access.push( {_user: self._holder._id, privileges: 'rwscd', creator: true, createdAt: new Date(), _createdBy: self._holder._id } );
          self.access[self._holder._id] = { privileges: 'rwsd' };
          callback();
        }
      }
    });
  }
  nextParent();

}

module.exports = exports = AccessIdiomPlugin;