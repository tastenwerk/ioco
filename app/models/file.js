/*
 * ioco - app/models/label
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../../lib/db' )
  , path = require( 'path' )
  , fs = require( 'fs' )
  , AccessIdiomPlugin = require( __dirname + '/../../lib/db/plugins/access_idiom')
  , VersioningIdiomPlugin = require( __dirname + '/../../lib/db/plugins/versioning_idiom')
  , LabelIdiomPlugin = require( __dirname + '/../../lib/db/plugins/label_idiom')
  , DefaultPlugin = require( __dirname + '/../../lib/db/plugins/default_idiom');

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

FileSchema.plugin( DefaultPlugin );
FileSchema.plugin( AccessIdiomPlugin );
FileSchema.plugin( LabelIdiomPlugin );
FileSchema.plugin( VersioningIdiomPlugin );

FileSchema.method('getFilePath', function filePath(){
  return path.join(this._id.toString().substr(22,2), this._id.toString(), this.name);
});

var uploadedFiles;

db.model( 'File', FileSchema );