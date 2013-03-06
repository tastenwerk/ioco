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

var LabelSchema = db.Schema({
  name: String
});

LabelSchema.plugin( AccessIdiomPlugin );
LabelSchema.plugin( LabelIdiomPlugin );
LabelSchema.plugin( VersioningIdiomPlugin );

db.model( 'Label', LabelSchema );