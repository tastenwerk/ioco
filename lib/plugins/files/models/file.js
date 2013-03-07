
/**
 * the File model
 * is meant to help organizing
 * files and categorize them
 */

var iomapper = require('iomapper');

var FileSchema = iomapper.mongoose.Schema({ 
  description: {type: iomapper.mongoose.Schema.Types.Mixed, default: { default: '' } },
  copyright: {type: iomapper.mongoose.Schema.Types.Mixed, default: { default: '' } },
  picCropCoords: { type: iomapper.mongoose.Schema.Types.Mixed, default: { w: 0, h: 0, x: 0, y: 0 } },
  backgroundPosition: { type: String, default: '0 0' },
  dimension: { type: String, default: '' },
  fileSize: Number,
  tags: {type: Array, default: []},
  contentType: String,
  _subtype: String
})
FileSchema.plugin( iomapper.plugin );
var File = iomapper.mongoose.model( 'File', FileSchema );

module.exports = exports = File;
