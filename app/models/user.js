/*
 * ioco - app/models/user
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../../lib/db' )
  , crypto = require('crypto');

/**
 * UserLoginLogSchema
 *
 * the login log keeps track of
 * the users logins
 */
var UserLoginLogSchema = new db.Schema({
  ip: String,
  createdAt: { type: Date, default: Date.now }
});

/**
 * UserMessagesSchema
 *
 * a message is for inner communication
 * between users
 */
var UserMessagesSchema = new db.Schema({
  content: String,
  read: {type: Boolean, default: false},
  author: { type: db.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

/**
 * a message can have followups
 */
UserMessagesSchema.add({
  followUps: [UserMessagesSchema]
});

/**
 * computes the user's full name
 * to display
 * in worst case, this is the user's email
 * address
 */
function getUserFullName(){
  if( this.name.first && this.name.last )
    return this.name.first + ' ' + this.name.last;
  else if( this.name.first )
    return this.name.first;
  else if( this.name.last )
    return this.name.last;
  else if( this.name.nick )
    return this.name.nick;
  else
    return this.email;
}

/**
 * the actual UserSchema
 *
 */
var UserSchema = db.Schema({
      name: {
        first: String,
        last: String,
        nick: { type: String, lowercase: true, index: { unique: true } }
      },
      hashedPassword: {type: String, required: true},
      salt: {type: String, required: true},
      preferences: {type: db.Schema.Types.Mixed, default: { common: { locale: 'en', hosts: [] }, docklets: [ 'notification_service/docklets/summary', 'notification_service/docklets/clock' ] } },
      picCropCoords: { type: db.Schema.Types.Mixed, default: { w: 0, h: 0, x: 0, y: 0 } },
      messages: [ UserMessagesSchema ],
      email: {type: String, 
              lowercase: true,
              required: true,
              index: { unique: true },
              match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i },
      loginLog: [ UserLoginLogSchema ],
      friends: [{ type: db.Schema.Types.ObjectId, ref: 'User' }],
      lastRequest: {
        createdAt: Date,
        ip: String
      },
      confirmation: {
        key: String,
        expires: Date,
        tries: { type: Number, default: 3}
      },
      createdAt: { type: Date, default: Date.now },
      suspended: { type: Boolean, default: false }
});

/**
 * name.full virtual
 *
 * constructs a string which is definitely not null
 * and represents a (not unique) name of this user
 */
UserSchema.virtual('name.full').get( getUserFullName );

/**
 * show the number of unread messages
 *
 */
UserSchema.virtual('unreadMessages').get( function(){
  var unread = 0;
  this.messages.forEach( function( message ){
    if( !message.read ) unread+=1;
  });
  return unread;
});;

/**
 * set hashedPassword
 *
 * @param {String} password - the unencrypted password to be set
 */
UserSchema.virtual('password').set(function( password ) {
    this._password = password;
    this.salt = this.generateSalt();
    this.hashedPassword = this.encryptPassword(password);
})

/**
 * get unenrypted password
 *
 * @return {String} the unencrypted password (exists only for the time of obejct
 * creation)
 */
UserSchema.virtual('password').get(function() { 
  return this._password; 
});

/**
 * authenticate user
 *
 * compares hashed password with given plain text password
 *
 * @param {String} plainTextPassword the plain text password which
 * will be hase-compared against the original password saved to
 * the database
 */
UserSchema.method('authenticate', function(plainTextPassword) {
  return this.encryptPassword(plainTextPassword) === this.hashedPassword;
});

/**
 * generate salt
 *
 * generate the password salt
 */
UserSchema.method('generateSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

/**
 *
 * encrypt password
 *
 * @param {String} password - clear text password string
 * to be encrypted
 */
UserSchema.method('encryptPassword', function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

/**
 * anybody user id
 */
UserSchema.statics.anybodyId = 'a00000000000000000000000';

/**
 * the anybody user
 * is similar to publishing something. If anybody user has
 * access to an object, it will be schown to the public.
 *
 */
UserSchema.statics.anybody = { name: { full: 'anybody', nick: 'anybody' }, _id: UserSchema.statics.anybodyId };

/**
 * system user id
 */
UserSchema.statics.systemId = 's00000000000000000000000';

/**
 * the system user
 * is used to create content from public access (without a user
 * being logged in)
 *
 */
UserSchema.statics.system = { name: { full: 'system', nick: 'system'}, _id: UserSchema.statics.systemId };

/**
 * everybody user id
 */
UserSchema.statics.everybodyId = 'e00000000000000000000000';

/**
 * the everybody user
 * if a content object is shared with the everybody user, 
 * any logged in user can access this content with the
 * given privileges.
 *
 * An everybody-shared content cannot be shared with other
 * users ( would avoid everybody access, if removed later )
 * nor can everybody-user get deletion privileges
 *
 */
UserSchema.statics.everybody = { name: {full: 'everybody', nick: 'everybody'}, _id: UserSchema.statics.everybodyId };

module.exports = db.model('User', UserSchema);