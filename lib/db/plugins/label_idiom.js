/*
 * ioco - lib/db/plugins/label_idiom
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../index' );

var LabelIdiomPlugin = function LabelIdiomPlugin( schema, options ){

  schema.add({ 
    _labelIds: { type: Array, index: true, default: [] },
    _type: String
  });

  schema.virtual('labelPath').get( function(){
    return this._type + ':' + this._id;
  });

  /**
   * save the modelname along with the database
   */
  schema.pre('save', function setupModelName( next ){
    if( this.isNew )
      this._type = this.constructor.modelName;
    next();
  });

  /**
   * add a label to this document
   *
   * @param {Document or String} - a valid ioco model instance or
   * a string of type 'ModelName:instance_id'
   * 
   */
  schema.method('addLabel', function( label ){
    if( typeof(label) === 'object' )
      this._labelIds.push( label.labelPath );
    else
      this._labelIds.push( label );
  });

  /**
   * load all associated labels
   *
   * @param {Object} - query (optional)
   * @param {Function( err, labels )} - callback
   *
   */
  schema.method('labels', function( query, callback ){
    if( typeof(callback) !== 'function' ){
      callback = query;
      query = null;
    }

    var _labels = [];
    var self = this;

    function loadNextLabel(){
      if( _labels.length === self._labelIds.length )
        return callback( null, _labels );
      var type = self._labelIds[ _labels.length ].split(':')[0]
        , _id = self._labelIds[ _labels.length ].split(':')[1];
      var q = db.model( type ).findById(_id);
      if( query ) 
        q.where( query )
      q.execWithUser( self._holder, function( err, label ){
        if( err )
          return callback( err );
        if( label instanceof db.model( type ) )
          _labels.push( label );
        else
          return callback( 'could not instanciate document ' + require('util').inspect(label) );
        loadNextLabel();
      });

    }

    loadNextLabel();

  });

  /**
   * loads all children associating this document
   * as label
   *
   * @query {Object} - a query
   * @param {Function( err, children )} - callback
   *
   */
  schema.method('children', function( callback ){
    var _children = [];
    var triedModels = 0;
    var self = this;

    function tryNextModel(){

      if( triedModels >= db.models.length )
        return callback( null, _children );

      db.model( db.models[triedModels++] ).where( '_labelIds', self._type+':'+self._id.toString() ).find().execWithUser( self._holder, function( err, children ){
        if( err )
          return callback( err );
        if( children )
          _children = _children.concat( children );
        else
          return callback( 'did not get any children result when trying to search in ' + db.models[triedModels-1] );
        tryNextModel();
      });

    }

    tryNextModel();

  });

  /*
  schema.pre( 'save', accessControl.setupCreatorAndAccess );
  schema.pre( 'save', accessControl.syncChildren );
  schema.method('share', accessControl.share );
  schema.method('unshare', accessControl.unshare );
  schema.method('privileges', accessControl.privileges );
  schema.method('canRead', accessControl.canRead );
  schema.method('canWrite', accessControl.canWrite );
  schema.method('canShare', accessControl.canShare );
  schema.method('canDelete', accessControl.canDelete );
*/

}

module.exports = exports = LabelIdiomPlugin;