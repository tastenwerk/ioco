var im = require('imagemagick')
  , util = require('util')
  , fs = require('fs')
  , path = require('path');

var ioco = require( __dirname + '/../../ioco' );

/**
 * create a file from a given files list
 * and create next
 *
 * @param {number} count
 * @param {array} files array
 * @param {object} req obj
 * @param {User} the holder
 * @param {string} dimension like '400x300'
 * @param {function( err, files )}
 *
 * @api private
 */
function upload( req, user, dimensions, callback ){

  var PAUSE_TIME = 5000
    , bytesUploaded = 0
    , incomingFile = req.files.file;

  ioco.db.model('File').create( {holder: user, name: incomingFile.name, contentType: incomingFile.type, fileSize: incomingFile.size}, function( err, file ){

    var filepath = path.join( ioco.config.datastore.absolutePath, 'files', file.getFilePath() );
    if( !fs.existsSync( path.join( ioco.config.datastore.absolutePath ) ) )
      fs.mkdirSync( ioco.config.datastore.absolutePath );
    if( !fs.existsSync( path.join( ioco.config.datastore.absolutePath, 'files' ) ) )
      fs.mkdirSync( path.join( ioco.config.datastore.absolutePath, 'files' ) );
    if( !fs.existsSync( path.dirname(path.dirname(filepath)) ) )
      fs.mkdirSync( path.dirname(path.dirname(filepath)) );
    if( !fs.existsSync( path.dirname(filepath) ) )
      fs.mkdirSync( path.dirname(filepath) );

    //var fileStream = fs.createWriteStream( filepath );

    // write/read streams are required if /tmp dir is not on same partition
    // as datastore path
    var writeStream = fs.createWriteStream(filepath)
    var readStream = fs.createReadStream(incomingFile.path)
    readStream.pipe( writeStream, { end: false } );
    readStream.on('end', function(err){
      if( err )
        return callback( err );
      writeStream.end();
      fs.unlinkSync(incomingFile.path);
      if( dimensions )
        resize( filepath, dimensions, function( err ){ callback( err, file ); } );
      else
        callback( null, file );
    });

  }); // create

}

/**
 * resizes the given file
 * to given dimensions
 *
 * @api private
 */
function resize( filepath, dimensions, callback ){

  var origFilepath = path.join( path.dirname(filepath), path.basename(filepath)+'_orig'+path.extname(filepath));
  fs.renameSync( filepath, origFilepath );

  console.log(filepath)
  console.log(origFilepath);

  var resizeOpts = { srcPath: origFilepath, dstPath: filepath };
  if( dimensions.indexOf('x') > 0 ){
    resizeOpts.width = parseInt(dimensions.split('x')[0]);
    resizeOpts.height = parseInt(dimensions.split('x')[1]);
  } else
    resizeOpts.width = parseInt(dimensions);

  im.resize( resizeOpts, function( err, stdout, stderr ){
    if( err ) throw err;
    console.log('resized to dimensions', dimensions);
    fs.unlinkSync( origFilepath );
    callback( err )
  });

}

module.exports = exports = {

  upload: upload,

  resize: resize

};