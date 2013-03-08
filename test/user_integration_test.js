var request = require('superagent')
  , session = request.agent()
  , should = require('should')
  , express = require('express')
  , ioco = require( 'ioco' )
  , testHelper = require( __dirname + '/helper' );

describe('/users integration', function(){

  before(function(){
    var app = testHelper.setupApp();
    testHelper.startWebServer();
  });

  after(function(){
    ioco.db.close();
  });

  describe( 'without login' , function(){
    describe('GET /users without login', function(){

      it('should not let user pass to users without login (redirects to login)', function(done){
        session
          .get('http://localhost:8999/users')
          .end( function( err, res ){
            should.not.exist( err );
            res.text.should.match(/login/);
            done();
          });
      });

    });

    describe('GET /login page', function(){

      it('shows a login form for user', function(done){
        session
          .get('http://localhost:8999/login')
          .end( function( err, res ){
            should.not.exist( err );
            res.should.have.status(200);
            res.text.should.match(/name="email"/)
            res.text.should.match(/name="password"/)
            done();
          });
      });

    });

    describe('POST /login', function(){
      it('shows a login form for user', function(done){
        session
          .post('http://localhost:8999/login')
          .send({ email: 'manager', password: 'mgr' })
          .end( function( err, res ){
            should.not.exist( err );
            res.should.have.status(200);
            done();
          });
      });

    });

  });

  describe( 'with login', function(){

    before( function( done ){
      session
        .post('http://localhost:8999/login')
        .send({ email: 'manager', password: 'mgr' })
        .end(function(err, res) {
          should.not.exist(err);
          res.should.have.status(200);
          done();
        });
    });

    
    describe('should be logged in now', function(){
      
      it('user is now logged in', function(done){
        session
          .get('http://localhost:8999/admin')
          .end( function( err, res ){
            should.not.exist( err );
            res.should.have.status(200);
            done();
          });
      });

    });

  });

});