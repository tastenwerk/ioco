var should = require('should')
  , ioco = require( __dirname + '/../lib/ioco' );

describe('db connection', function(){

  it('connects to the database', function(){
    should.not.exist( ioco.db.connection );
    ioco.db.open( 'mongodb://localhost:27017/ioco_testdb' );
    ioco.db.connection.should.be.a('object');
  });

  it('closes a connection to the database', function( done ){
    ioco.db.close( function(){
      should.not.exist(ioco.db.connection);
      done();
    });
  })

});