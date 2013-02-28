var should = require('should')
  , ioco = require( __dirname + '/../lib/ioco' );

describe('settings and configuration', function(){

  it('reads the settings file on load time', function(){
    ioco.config.get('db').should.be.a('object');
  });

  it('sets a setting in the config', function(){
    should.not.exist( ioco.config.get('mysetting') );
    ioco.config.set('mysetting', true);
    ioco.config.get('mysetting').should.eql(true);
  });

});
