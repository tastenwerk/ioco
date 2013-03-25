var should = require('should')
  , ioco = require( 'ioco' );

var helper = require( __dirname + '/helper' );

describe('ioco versions', function(){

  before( function( done ){
    ioco.db.open( 'mongodb://localhost:27017/ioco_testdb' );
    ioco.initModels();
    this.Label = ioco.db.model('Label');
    var setup = this;

    helper.setupUser( this, function( obj ){
      for(var i in obj)
        setup[i] = obj[i];
      setup.Label.create({ name: 'vLabel', holder: setup.userA }, function( err, label ){
        setup.label = label;
        console.log('here');
        done();
      });
    });
  });

  after( function( done ){
    ioco.db.close( done );
  });

  describe('#createVersion', function(){

    describe('default with no  args', function(){

      it( 'has a new version', function(){

        this.label.versions.should.be.lengthOf(0);
        this.label.createVersion();
        this.label.versions.should.be.lengthOf(1);

      });

      it( 'new version stores attributes', function(){

        this.label.versions[0].data.should.have.property('name');
        this.label.versions[0].data.name.should.eql('vLabel');

      });

      it( 'new version stores holder', function(){

        this.label.versions[0]._createdBy.should.eql( this.userA._id );

      });

    });

    describe('comment option passed', function(){

      it( 'copies given attrs to a version with comment', function(){

        this.label.createVersion({ comment: 'this is my comment' });
        this.label.versions.should.be.lengthOf(2);
        this.label.versions[1].comment.should.eql('this is my comment');

      });

    });

  });

  describe('#switchVersion', function(){

    describe('switches back to first version', function(){

      it( 'restores original attributes', function(){
        this.label.name = 'changed and lost';
        this.label.switchVersion(0);
        this.label.name.should.eql('vLabel');
      });

      it( 'unset attributes in version will be set to null', function(){

        this.label.properties = { deleted: 0 };
        this.label.switchVersion(0);
        should.not.exist( this.label.properties );

      });

      it( 'does not store current attributes if no saveCurrent option was passed', function(){

        this.label.versions.should.be.lengthOf(2);

      });

    });

    describe('saveCurrent option saves the current attributes before restoring to given version', function(){

      it( 'has a new version set', function(){

        this.label.name = 'changed not lost';
        this.label.switchVersion(0, {saveCurrent: true});
        this.label.name.should.eql('vLabel');
        
        this.label.versions.should.be.lengthOf(3);

      });

      it( 'holds attrs of document before switching back to version', function(){
        this.label.versions[ this.label.versions.length-1 ].data.name.should.eql('changed not lost');
      });

    });

  });

});