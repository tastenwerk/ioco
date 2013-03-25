/*
 * ioco - lib/db/plugins/label_idiom
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../index' );

var DefaultPlugin = function DefaultPlugin( schema, options ){

  schema.add({ 
    name: { type: String, required: true, index: true },
    properties: { type: db.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    _createdBy: { type: db.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date },
    _updatedBy: { type: Date }
  });

}

module.exports = exports = DefaultPlugin;