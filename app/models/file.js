/*
 * ioco - app/models/label
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../../lib/db' )
  , AccessIdiomPlugin = require( __dirname + '/../../lib/db/plugins/access_idiom')
  , VersioningIdiomPlugin = require( __dirname + '/../../lib/db/plugins/versioning_idiom')
  , LabelIdiomPlugin = require( __dirname + '/../../lib/db/plugins/label_idiom');

var FileSchema = db.Schema({ 
  description: {type: db.Schema.Types.Mixed, default: { default: '' } },
  copyright: {type: db.Schema.Types.Mixed, default: { default: '' } },
  picCropCoords: { type: db.Schema.Types.Mixed, default: { w: 0, h: 0, x: 0, y: 0 } },
  backgroundPosition: { type: String, default: '0 0' },
  dimension: { type: String, default: '' },
  fileSize: Number,
  tags: {type: Array, default: []},
  contentType: String,
  _subtype: String
});

FileSchema.plugin( AccessIdiomPlugin );
FileSchema.plugin( LabelIdiomPlugin );
FileSchema.plugin( VersioningIdiomPlugin );

db.model( 'File', FileSchema );
