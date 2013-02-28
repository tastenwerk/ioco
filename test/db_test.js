var should = require('should')
  , ioco = require( __dirname + '/../lib/ioco' );

describe('db connection', function(){

  it('connects to the given database adapter and keeps connection open', function(){
    should.not.exist(ioco.db.connection);
    ioco.db.open( 'dummy://testdb' );
    ioco.db.connection.should.be.a('object');
  });

});

describe('db schemas', function(){

  before( function(){
    this.PageSchema = new ioco.db.Schema({
      name: String
    });
  });

  it('defines a new db schema (which should be handled by the adapter)', function(){
    this.PageSchema.should.be.an.instanceof( ioco.db.Schema );
  });

  it('adds a method to a schema', function(){
    this.PageSchema.methods.should.be.a('object');
    this.PageSchema.methods.publish = function(){ this.published = true };
    var Page = ioco.db.model( 'Page', this.PageSchema );
    var page = new Page();
    page.publish.should.be.a('function');
  });

  it('adds a statics method to a schema', function(){
    this.PageSchema.statics.should.be.a('object');
    this.PageSchema.statics.rootsOnly = function(){};
    var Page = ioco.db.model( 'Page', this.PageSchema );
    Page.rootsOnly.should.be.a('function');
  });

  it('sets a virtual for the schema', function(){
    this.PageSchema.virtuals.should.be.a('object');
    this.PageSchema.virtuals.slug = function(){ return 'a'; };
    var Page = ioco.db.model( 'Page', this.PageSchema );
    var page = new Page();
    page.slug.should.eql('a');
  })

})