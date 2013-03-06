var should = require('should')
  , ioco = require( 'ioco' );

var helper = require( __dirname + '/helper' );

describe('ioco labels', function(){

  before( function( done ){
    ioco.db.open( 'mongodb://localhost:27017/ioco_testdb' );
    ioco.init();
    this.Label = ioco.db.model('Label');
    var setup = this;
    this.Label.remove( function( err ){
      helper.setupUser( this, function( obj ){
        for(var i in obj)
          setup[i] = obj[i];
        done()
      });
    });
  });

  after( function( done ){
    ioco.db.close( done );
  })

  describe('crud methods', function(){

    describe('#create', function(){

      it('creates a new label', function(done){
        this.Label.create({name: 'l0', holder: this.userA}, function( err, label ){
          should.not.exist( err );
          label.should.have.property( '_id' );
          label.isNew.should.eql(false);
          done();
        });
      });

    });

    describe('#find', function(){

      it('finds a label', function( done ){
        this.Label.findOne({name: 'l0'}, function( err, label ){
          should.not.exist(err);
          label.should.have.property('_id');
          done();
        });
      });

      it('finds a label with desired user', function( done ){
        this.Label.where('name').equals('l0').findOne().execWithUser( this.userA, function( err, label ){
          should.not.exist(err);
          label.name.should.eql('l0');
          done();
        })
      })

    });

    describe('#update', function(){

      before( function(done){
        var setup = this;
        this.Label.where('name', 'l0').findOne().execWithUser( setup.userA, function( err, label ){
          setup.label = label;
          done();
        });
      });

      it('updates an existing label', function(done){
        var setup = this;
        this.label.update({name: 'l0mod'}, function( err ){
          should.not.exist( err );
          setup.Label.findById( setup.label._id, function( err, label ){
            label.name.should.eql('l0mod');
            done();
          })
        });
      });

    });

    describe('#remove', function(){

      before( function(done){
        var setup = this;
        this.Label.findOne({name: 'l0mod'}, function( err, label ){
          setup.label = label;
          done();
        });
      });

      it('removes an existing label permanently', function(done){
        var setup = this;
        this.label.remove( function( err ){
          should.not.exist( err );
          setup.Label.count( function( err, num ){
            num.should.eql(0);
            done();
          });
        });
      });

    });

    describe('#trash', function(){

      before( function( done ){
        var setup = this;
        this.Label.create({name: 'l1', holder: setup.userA}, function( err, label ){
          setup.label = label;
          done();
        });
      });

      it('marks a label as trashed by setting the deletedAt flag', function(done){
        var setup = this;
        this.label.trash( function( err ){
          should.not.exist( err );
          setup.Label.findOne().execWithUser( setup.userA, function( err, label ){
            should.not.exist( err );
            should.not.exist( label );
            done();
          });
        });
      });

    });

    describe('#trash (finding trashed documents)', function(){

      it('wont find a trashed doument with normal find lookups', function(done){
        var setup = this;
        setup.Label.findOne().execWithUser( setup.userA, function( err, label ){
          should.not.exist( err );
          should.not.exist( label );
          done();
        })
      });

      it('finds a trashed document with @trashed scope', function(done){
        var setup = this;
        setup.Label.findOne().execWithUser( { holder: setup.userA,
          trashed: true}, function( err, label ){
          should.not.exist( err );
          label.name.should.eql('l1');
          done();
        })
      });

    });

    describe('#restore', function(){

      before( function( done ){
        var setup = this;
        setup.Label.where('name', 'l1').findOne().execWithUser( {holder: setup.userA,
          trashed: true}, function( err, label ){
          setup.label = label;
          done();
        });
      });

      it('restores a label from trash', function(done){
        var setup = this;
        setup.label.restore( function( err ){
          should.not.exist( err );
          setup.Label.where('name').equals('l1').findOne().execWithUser( setup.userA, function( err, label ){
            should.not.exist( err );
            label.should.be.an.instanceof( setup.Label );
            should.not.exist( label.deletedAt );
            done();
          })
        });
      });

    });

  });

  describe('labels', function(){

    before( function( done ){
      var setup = this;
      setup.Label.where('name', 'l1').findOne().execWithUser( setup.userA, function( err, label ){
        setup.l1 = label;
        done();
      });
    });

    describe( 'adding labels', function(){

      it('generates a path for a root document (not labeled with anything)', function(){
        this.l1.labelPath.should.eql( this.l1._type+':'+this.l1._id );
      });

      it('adds a label to a document', function( done ){
        var setup = this;
        this.Label.create({name: 'l2', holder: setup.userA}, function( err, label ){
          should.not.exist( err );
          label._labelIds.should.be.lengthOf(0);
          label.addLabel( setup.l1 );
          label._labelIds.should.be.lengthOf(1);
          label._labelIds[0].should.eql( setup.l1._type+':'+setup.l1._id );
          label.save( function( err ){
            should.not.exist( err );
            done();
          });
        })
      });

      it('adds a label on creation time', function( done ){
        var setup = this;
        this.Label.create({name: 'l3', _labelIds: [ setup.l1.labelPath ], holder: setup.userA}, function( err, label ){
          should.not.exist(err);
          label._labelIds.should.be.lengthOf(1);
          label._labelIds[0].should.eql( setup.l1._type+':'+setup.l1._id );
          done();
        })
      });

    });

    describe('loading labels', function(){

      before( function( done ){
        var setup = this;
        setup.Label.where('name', 'l3').findOne().execWithUser( setup.userA, function( err, label ){
          setup.l3 = label;
          done();
        });
      });

      it('loads associated labels of this document', function( done ){
        var setup = this;
        setup.l3.labels( function( err, labels ){
          should.not.exist( err );
          labels.should.be.lengthOf( 1 );
          labels[0]._id.should.eql( setup.l1._id );
          done();
        });
      });

      it('loads associated children of this document', function( done ){
        var setup = this;
        setup.l1.children( function( err, children ){
          should.not.exist( err );
          children.should.be.lengthOf( 2 );
          children[0]._type.should.eql( 'Label' );
          done();
        })
      })

    });

  });

  describe('versioning', function(){

  });

  describe('labeling', function(){

  });

  describe('access control', function(){

    describe('sharing, publishing and listing', function(){
      it('lists current access', function(){
      });

      it('grants access to a user for this label', function(){
      });

      it('revokes access for a user for this label', function(){
      });

      it('publishes a document', function(){
      });

      it('unpublishes a document', function(){
      });

      it('creates a new user, if creating user has privileges to invite new users', function( done ){
        done();
      });

    });

    describe('dealing with documents in access control enabled scopes', function(){

      it('wont deal with access control if document has no @private property set', function(done){
        done();
      });

      it('retreive only documents where user explicitely has access on', function(done){
        done();
      });

    });


  })

});