var should = require('should')
  , ioco = require( __dirname + '/../lib/ioco' );

describe('settings and configuration', function(){

  it('reads the settings file on load time', function(){
    ioco.config.db.should.be.a('object');
  });

  it('sets a setting in the config', function(){
    should.not.exist( ioco.config.mysetting );
    ioco.config.mysetting = true;
    ioco.config.mysetting.should.eql(true);
  });

});
