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
    activeRevision: { type: String, default: 'master' },
    lang: String
  });

  schema.method('setContent', function setWikiContent( revision, content ){
    if( arguments.length < 2 ){
      content = revision;
      revision = 'master';
    }
    this.revisions[revision].content = content;
  });

  schema.post('init', function setWikiContentAfterInit( doc ){
    doc.content = doc.revisions[doc.activeRevision].content;
  });

}

module.exports = exports = WikiPlugin;