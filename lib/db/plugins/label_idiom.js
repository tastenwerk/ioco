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
    _childrenIds: { type: Array, index: true, default: [] }
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
    this._addedLabels = this._addedLabels || [];
    this._addedLabels.push( label );
    if( typeof(label) === 'object' ){
      this._labelIds.push( label.labelPath );
      label._childrenIds.push( this.labelPath );
    } else
      this._labelIds.push( label );
  });

  /**
   * removes a label
   *
   * @param {Document or String} - a valid ioco model instance
   * or a string of type 'ModelName:instance_id'
   */
  schema.method('removeLabel', function( label ){
    this._removedLabels = this._removedLabels || [];
    this._removedLabels.push( label );
    if( typeof(label) === 'object' ){
      label._childrenIds.splice( label._childrenIds.indexOf( this.labelPath ), 1 );
      this._labelIds.splice( this._labelIds.indexOf( label.labelPath ), 1 );
    } else
      this._labelIds.splice( label, 1 );
  });

    /**
   * add a child to this document
   *
   * @param {Document or String} - a valid ioco model instance or
   * a string of type 'ModelName:instance_id'
   * 
   */
  schema.method('addChild', function( child ){
    this._addedChildren = this._addedChildren || [];
    this._addedChildren.push( child );
    if( typeof(child) === 'object' ){
      child._labelIds.push( this.labelPath );
      this._childrenIds.push( child.labelPath );
    } else
      this._labelIds.push( child );
  });

  /**
   * removes a child
   *
   * @param {Document or String} - a valid ioco model instance
   * or a string of type 'ModelName:instance_id'
   */
  schema.method('removeChild', function( child ){
    this._removedChildren = this._removedChildren || [];
    this._removedChildren.push( child );
    if( typeof(child) === 'object' ){
      child._labelIds.splice( child._childrenIds.indexOf( this.labelPath ), 1 );
      this._childrenIds.splice( this._childIds.indexOf( child.labelPath ), 1 );
    } else
      this._childrenIds.splice( child, 1 );
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

  /**
   * finds all parents
   *
   * @param {Object} [query] optional query object
   * @param {Object} [options]
   * @param {Function} [callback] - [ err, array ]
   *
   */
  schema.method('parents', function documentParents( query, options, callback ){
    if( typeof( callback ) === 'undefined' ){
      if( typeof( options ) === 'undefined' )
        callback = query;
      else
        callback = options;
      options = null;
    }
    var parentsArr = []
      , self = this
      , count = 0;

    function findNextParent(){
      if( self._labelIds.length <= count )
        return callback( null, [] );
      var parType = self._labelIds[count].split(':')[0];
      var parId = self._labelIds[count++].split(':')[1];
      self.db.model(parType).findById(parId, function( err, parent ){
        if( err )
          return callback( err );
        parent.holder = self.holder;
        parentsArr.push( parent );
        ++count >= self._labelIds.length && 
          callback( null, parentsArr ) ||
          findNextParent();
      });
    }

    findNextParent();

  });

  /**
   * retreives document's ancestors
   *
   * @param {Function} [callback]. The callback to be triggered
   * after the database query returns results:
   * [ err, results ]
   */
  schema.method('ancestors', function ancestors( callback ){
    var ancs = [];
    function nextAncestor( anc ){
      if( anc._labelIds.length > 0 )
        anc.parents( function( err, parents ){
          if( err ) return callback( err );
          if( parents.length > 0 )
            ancs.push( parents[0] );
          else
            callback( 'first parent ' + anc._labelIds.join(', ') + ' not found');
          if( parents.length > 0 )
            nextAncestor( parents[0] );
          else
            callback( null, ancs.reverse() );
        });
      else
        callback( null, ancs.reverse() );
    }
    nextAncestor( this );
  });

  function updateChild( count, children, remove, callback ){
    var self = this;
    if( count >= children.length )
      return callback();
    var type = children[count].split(':')[0]
      , _id = children[count++].split(':')[1];
    ioco.db.model(type).findById( _id, function( err, doc ){
      if( err )
        console.log('error loading child', err);
      if( remove )
        doc._labelIds.splice( doc._labelIds.indexOf(self._type+':'+self._id), 1 );
      else
        doc._labelIds.push( self._type+':'+self._id );
      doc.save( function( err ){
        if ( err )
          console.log('error saving child', err );
        updateChild.call( self, count, children, callback );
      });
    });
  }

  schema.pre('save', function updateChildren( done ){
    console.log('having', arguments);
    if( !this._addedChildren && !this._removedChildren )
      return done();

    updateChild.call( this, 0, this._addedChildren, false, done );
    updateChild.call( this, 0, this._removedChildren, true, done );

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

function _sortArray( arr, sortOptions ){
  var sort;
  if( typeof(sortOptions) === 'undefined' || !sortOptions )
    sort = {name: 'asc'};
  else if( sortOptions instanceof String )
    sortOptions.split(' ').forEach( function(so){
      if( so.substring(0,1) === '-' )
        sort[so] = 'desc';
      else
        sort[so] = 'asc';
    })
  else
    sort = sortOptions;
  arr.sort( function( a, b ){
    for( var i in sort )
      if( ( a[i] && b[i] && a[i] < b[i] ) || !a[i] && b[i] )
        return ( sort[i] === 'asc' ? -1 : 1 );
      else if( ( a[i] && b[i] && a[i] > b[i] ) || a[i] && !b[i] )
        return ( sort[i] === 'asc' ? 1 : -1 );
      else
        return 0;
  });
  var a = []
  for( var i in arr )
    a.push( arr[i].name + ':' + arr[i].pos );
  return arr;
}

module.exports = exports = LabelIdiomPlugin;