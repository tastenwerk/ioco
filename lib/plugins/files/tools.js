//im = require('imagemagick')
var gm = require('gm')
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

  var incomingFile = req.files.file;

  var file = new ioco.db.model('File')( {holder: user, name: incomingFile.name, contentType: incomingFile.type, fileSize: incomingFile.size} );
  
  if ( req.body.label )
    file.addLabel( req.body.label );

  file.save( function( err ){

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


function resize( filepath, dimensions, forceContentType, callback ){

  if( typeof(forceContentType) === 'function' && arguments.length === 3 ){
    callback = forceContentType;
    forceContentType = null;
  }

  var origFilepath = path.join( path.dirname(filepath), path.basename(filepath).split('.')[0]+'_cpy'+path.extname(filepath));
  fs.renameSync( filepath, origFilepath );

  var imProc = gm( fs.readFileSync(origFilepath) );
  var w, h;
  w = h = dimensions;

  console.log('dimensions', dimensions)
  if( dimensions.split('x').length === 2 ){
    w = dimensions.split('x')[0];
    h = dimensions.split('x')[1];
  }

  if( forceContentType )
    filepath = filepath.replace(/.png|.jpg|.jpeg|.gif/,forceContentType);

  imProc.size( function( err, size ){
    if( err )
      console.log(err);
    var origW = size.width
      , origH = size.height;
      console.log(origW, origH, size);
    if( origW > origH )
      imProc.resize(null, h);
    else
      imProc.resize(w);

    imProc.write( filepath, function (err) {
      if( err ) console.log(err);
      console.log('resized to dimensions', w, h);
      fs.unlinkSync( origFilepath );
      callback( err )
    });
  });
}

function thumb( filepath, coords, callback ){

  var newFilepath = path.join( path.dirname(filepath), path.basename(filepath).split('.')[0]+'_thumb_'+coords.w+'x'+coords.h+path.extname(filepath));

  var imProc = gm( fs.readFileSync(filepath) );
  imProc.thumb( coords.w, coords.h, newFilepath, 80, function( err ){
    callback( err, newFilepath );
  });

}

function cropResized( filepath, coords, callback ){

  if( typeof(coords) === 'function' ){
    callback = coords;
    coords = null;
  }

  var newFilepath = path.join( path.dirname(filepath), path.basename(filepath).split('.')[0]+'_thumb_'+coords.w+'x'+coords.h+path.extname(filepath));

  var imProc = gm( fs.readFileSync(filepath) );

  console.log('cropped to dimensions', coords.w, coords.h, ' with coords ', coords.x, coords.y, filepath );

  imProc.size( function( err, size ){
    if( err )
      console.log(err);
    var origW = size.width
      , origH = size.height;
      console.log(origW, origH, size);
    if( origW > origH )
      imProc.resize(null, coords.h);
    else
      imProc.resize(coords.w);
    imProc.crop(coords.w, coords.h).write( newFilepath, function afterProcess(err) {
      if( err ) console.log('error when saving thumb', err);
      console.log('cropped to dimensions', coords.w, coords.h, ' with coords ', coords.x, coords.y, filepath);
      callback( err, newFilepath )
    });
  });


}

/**
 * resizes the given file
 * to given dimensions
 *
 * @api private
 */
function resize2( filepath, dimensions, callback ){

  var origFilepath = path.join( path.dirname(filepath), path.basename(filepath).split('.')[0]+'_orig'+path.extname(filepath));
  fs.renameSync( filepath, origFilepath );


  var resizeOpts = { srcPath: origFilepath, dstPath: filepath };
  if( dimensions.indexOf('x') > 0 ){
    resizeOpts.width = parseInt(dimensions.split('x')[0]);
    resizeOpts.height = parseInt(dimensions.split('x')[1]);
  } else
    resizeOpts.width = parseInt(dimensions);

  im.resize( resizeOpts, function( err, stdout, stderr ){
    console.log(stdout);
    console.log(stderr);
    if( err ) throw err;
    console.log('resized to dimensions', dimensions);
    fs.unlinkSync( origFilepath );
    callback( err )
  });

}

module.exports = exports = {

  upload: upload,

  resize: resize, 

  cropResized: cropResized,

  thumb: thumb

};