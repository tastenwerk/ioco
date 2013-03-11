/*
 * ioco - app/models/notification
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../../lib/db' );

var NotificationSchema = db.Schema({
  _creator: {type: db.Schema.Types.ObjectId, ref: 'User' },
  read: {type: Array, default: [] },
  message: {type: String, required: true },
  docType: String,
  docId: String,
  docName: String,
  affectedUserName: String,
  createdAt: {type: Date, default: Date.now},
  type: {type: String, default: 'System Notification'}
});

/**
 * before create check that
 * creator will have access on this object
 */
NotificationSchema.pre('save', function( next ){
  if( this.isNew ){
    //this.acl[this._creator.toString()] = { privileges: 'rwsd' };
    if( this._creator && this.read.indexOf( this._creator.toString() ) < 0 )
      this.read.push( this._creator.toString() );
    if( this.public && this.read.indexOf( db.model('User').anybodyId ) < 0 )
      this.read.push( db.model('User').anybodyId );
  }
  next();
});

db.model( 'Notification', NotificationSchema );