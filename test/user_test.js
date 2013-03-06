var should = require('should')
  , ioco = require( 'ioco' );

describe('ioco users', function(){

  before( function( done ){
    ioco.db.open( 'mongodb://localhost:27017/ioco_testdb' );
    ioco.init();
    this.User = ioco.db.model('User');
    this.User.remove( function( err ){
      if( err ) console.log( err );
      done();
    });
  });

  after( function( done ){
    ioco.db.close( done );
  });

  it('has 0 users when starting the tests', function( done ){
    this.User.count( function( err, num ){
      num.should.eql(0);
      done();
    });
  });

  describe('#name.full', function(){

    before( function(){
      this.user = new this.User({ name: { first: 'henry', last: 'v.', nick: 'henry' }, email: 'henry@thev.com' } );
    });

    it('should have a full property', function(){
      this.user.should.have.property('name').with.property('full');
    });

    it('fullname returns firstname[space]lastname', function(){
      this.user.name.full.should.eql(this.user.name.first + ' ' + this.user.name.last);
    });

    it('will return firstname if no lastname is given (without a space)', function(){
      this.user.name.last = null;
      this.user.name.first.should.eql(this.user.name.full);
    });

    it('will return lastname if no firstname is given (without a space)', function(){
      this.user.name.first = null;
      this.user.name.last = 'v.';
      this.user.name.last.should.eql(this.user.name.full);
    });

    it('will return nickname if neither firstname nor lastname is given', function(){
      this.user.name.last = this.user.name.first = null;
      this.user.name.nick.should.eql(this.user.name.full);
    });

    it('will return email address if none of the above attributes is given', function(){
      this.user.name.last = this.user.name.first = this.user.name.nick = null;
      this.user.email.should.eql(this.user.name.full);
    });

  });

  describe('required fields', function(){

    it('must have an email address set', function( done ){
      var user = new this.User({});
      user.save( function( err ){
        err.errors.email.type.should.eql('required');
        done();
      });
    });

    it('must have a valid email address', function( done ){
      var user = new this.User({ email: 'henry' });
      user.save( function( err ){
        err.errors.email.type.should.eql('regexp');
        done();
      });
    });

    it('must have a valid password set before it can be created', function( done ){
      var user = new this.User({ email: 'henry@v.com' });
      user.save( function( err ){
        err.errors.salt.type.should.eql('required');
        err.errors.hashedPassword.type.should.eql('required');
        done();
      });
    });

  });

  describe('crud operations', function(){

    describe('#save', function(){

      before( function(){
        this.userAttrs = { name: { first: 'henry', last: 'v.', nick: 'henry' }, email: 'henry@v.com', password: 'abc' };
        this.user = new this.User( this.userAttrs );
      });

      it('saves a valid user object to the database', function( done ){
        var setup = this;
        this.user.save( function( err ){
          should.not.exist( err );
          setup.User.findOne( function( err, user ){
            should.not.exist( err );
            user.should.be.an.instanceof( setup.User );
            user.name.full.should.eql( 'henry v.' );
            done();
          })
        });
      });

    });

    describe('#count', function(){

      it('counts the number of users in the database', function( done ){
        this.User.count( function( err, num ){
          should.not.exist( err );
          num.should.eql(1);
          done();
        });
      });

    });

    describe('#find', function(){

      it('finds one user by their first name', function( done ){
        var setup = this;
        this.User.findOne().where('name.first', 'henry').exec( function( err, user ){
          should.not.exist( err );
          user.should.be.an.instanceof( setup.User );
          done();
        });

      });

    });

    describe('#update', function(){

      before( function( done ){
        var setup = this;
        this.User.findOne( function( err, user ){
          setup.user = user;
          done();
        });
      });

      it('updates an existing users attributes', function( done ){
        var setup = this;
        this.user.update({ preferences: { empty: true } }, function( err ){
          should.not.exist( err );
          setup.User.findById( setup.user._id, function( err, user ){
            user.preferences.should.eql({ empty: true });
            done();
          });
        });

      });

    });

    describe('#remove', function(){

      before( function( done ){
        var setup = this;
        this.User.findOne( function( err, user ){
          setup.user = user;
          done();
        });
      });

      it('removes a user from the database (permanently)', function( done ){
        var setup = this;
        this.user.remove( function( err ){
          should.not.exist( err );
          setup.User.findById( setup.user._id, function( err, user ){
            should.not.exist( err );
            should.not.exist( user );
            done();
          });
        });
      });

    });

    describe('hashing password', function(){

      before( function( done ){
        var setup = this;
        this.User.create( setup.userAttrs, function( err, user ){
          setup.user = user;
          done();
        });
      });

      it('should set hashedPassword and salt if password is given', function(){
        this.user.hashedPassword.should.equal( this.user.encryptPassword(this.userAttrs.password) );
        this.user.hashedPassword.should.lengthOf( 40 );
        this.user.salt.length.should.within( 10, 14 );
      });

    });

  });

});