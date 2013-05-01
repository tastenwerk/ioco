/*
 * ioco - lib/db/plugins/wiki_idiom
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var db = require( __dirname + '/../index' );

var WikiPlugin = function WikiPlugin( schema, options ){

  schema.add({
    revisions: { type: db.Schema.Types.Mixed, default: { master: { content: '' } } },
    lang: String
  });

}

module.exports = exports = WikiPlugin;