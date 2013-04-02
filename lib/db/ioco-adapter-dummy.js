/*
 * ioco - lib/db/index
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 * dummy database connection adapter
 * does nothing is just for testing
 * purposes
 *
 */

var log = require( __dirname + '/../log' );


/**
 * @class Model
 *
 * dummy Model function with compmile method
 */
function Model( attrs ){
}

Model.compile = function( modelName, modelSchema, connection, base ){
  function model( attrs ) {
    Model.call( this, attrs );
  };

  model.modelName = modelName;
  model.__proto__ = Model;
  model.prototype.__proto__ = Model.prototype;
  model.prototype.db = connection;

  for( var i in modelSchema.attrs )
    model.prototype[i] = typeof(modelSchema.attrs[i]) === 'object' && modelSchema.attrs[i].default || null;

  for( var i in modelSchema.virtuals )
    Object.defineProperty( model.prototype, i, {
      enumerable: true,
      configurable: true,
      get: modelSchema.virtuals[i]
    })

  // apply methods
  for (var i in modelSchema.methods)
    model.prototype[i] = modelSchema.methods[i];

  // apply statics
  for (var i in modelSchema.statics)
    model[i] = modelSchema.statics[i];

  // apply named scopes
  if (modelSchema.namedScopes)
    modelSchema.namedScopes.compile(model);

  model.model = model.prototype.model;
  model.options = model.prototype.options;
  model.db = model.prototype.db;
  model.schema = model.prototype.schema;
  model.base = base;

  return model;
}

var dummyAdapter = {

  open: function openConnection( dbPathUri ){

    log.info( 'dummy adapter connecting to', dbPathUri );

  },

  Schema: function DummySchema( attrs ){
    this.attrs = attrs;
  },

  /**
   * derives a model of given schema
   *
   * @param {String} [modelName] - the name given to this model (most likely the collection or table name )
   * @param {Schema} [modelSchema] - the schema for this model
   */
  model: function modelDummy( modelName, modelSchema ){
    if( !modelSchema )
      return this.models[modelName];

    this.models[modelName] = Model.compile( modelName, modelSchema, this.connection, this );

    return this.models[modelName];

  }
  
};

/**
 * instance methods
 */
dummyAdapter.Schema.prototype.methods = {};

/**
 * static (class) methods
 */
dummyAdapter.Schema.prototype.statics = {};

/**
 * virtual properties (only available while initialized - not in db)
 */
dummyAdapter.Schema.prototype.virtuals = {};

module.exports = exports = dummyAdapter;