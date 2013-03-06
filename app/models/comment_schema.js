/*
 * ioco - app/models/comment
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../../lib/db' );

var CommentSchema = new db.Schema({
  _user: { type: db.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  content: String,
  deletedAt: Date
});

CommentSchema.add({
  comments: [CommentSchema]
});

module.exports = exports = CommentSchema;