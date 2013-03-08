/**
 *
 * users (general CRUD operations)
 *
 */

var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , crypto = require('crypto')
  , easyimg = require('easyimage')
  , moment = require('moment')
  , exec = require('child_process').exec;

var ioco = require( __dirname + '/../../ioco' )
  , auth = require( __dirname + '/../auth' )
  , streambuffer = require( __dirname + '/../../../lib/streambuffer');

ioco.view.paths = [ __dirname + '/views' ].concat( ioco.view.paths );

function sendConfirmationEmail( user, confirmationKey, newRecord, req, res ){
  ioco.sendMail.deliver({ 
    to: req.body.email,
    subject: '['+ioco.config.site.title+'] '+req.i18n.t('user.welcome'),
    text: req.i18n.t('user.welcome_text', {name: res.locals.currentUser.name.full}) +
          "\n\n  " + ioco.config.hostname + "/users/"+ user._id + "/confirm?key=" + confirmationKey + "\n\n" +
          req.i18n.t('bye', {site: ioco.config.site.title})
    }, 
    function( err, response ){
      if( err ){
        console.log( err );
        req.flash('error', err);
      } else
        req.flash('notice', req.i18n.t('user.confirmation_email.ok'));
      res.json({flash: req.flash(), success: (err===null), _id: user._id, user: user });
  });
}

module.exports = exports = {
  
  routes: function( app ){

    /**
     * show the UPLOAD form for a new user picture
     */
    app.get('/users/:id/change_pic_modal', auth.check, getUser, function( req, res ){
      if( !req.user )
        return res.send(' user not found ');
      res.render( __dirname + '/views/users/change_pic_modal.jade', {user: req.user} );
    });

    /**
     * create a new user
     */
    app.post('/users', auth.check, auth.admin, function( req, res ){
      req.assert('user.email', req.i18n.t('user.email_invalid')).isEmail();
      req.assert('user.name.nick', req.i18n.t('user.nick_required')).len(3,128);
      var errors = req.validationErrors();
      if( errors ){
        for( var i in errors )
          req.flash('error', errors[i].msg);
        return res.json({ flash: req.flash(), success: false });
      }
      var confirmationKey = crypto.createHash('sha1').update((new Date()).toString(32)).digest('hex');
      var user = new User({ name: {nick: req.body.user.name.nick,
                          first: req.body.user.name.first,
                          last: req.body.user.name.last},
                          password: (new Date()).getTime().toString(36),
                    email: req.body.user.email,
                    confirmation: { key: confirmationKey,
                                    expires: moment().add('d',1).toDate(),
                                    tries: 3 }
        });
      user.groups = ioco.config.userDefaultRoles || ['user'];
      user.save( function( err ){
        if( err )
          req.flash('error', util.inspect(err));
        else{
          req.flash('notice', req.i18n.t('user.creation.ok'));
          if( req.body.user.sendConfirmationEmail && req.body.user.sendConfirmationEmail === 'true' )
            sendConfirmationEmail( user, confirmationKey, true, req, res );
        }
        res.json({flash: req.flash(), success: (err===null), _id: user._id });

      });
    });

    /**
     * Perform the actual upload for the user picture
     */
    app.post('/users/:id/change_pic_modal', streambuffer, auth.check, getUser, function( req, res ){

      var PAUSE_TIME = 5000
        , bytesUploaded = 0;

      if(req.xhr) {
        var fileName = req.header('x-file-name');
        var fileSize = req.header('content-length');
        var fileType = req.header('x-mime-type');

        var userDirPath = path.join( ioco.config.datastore.absolutePath, 'users', req.user._id.toString() );
        if( !fs.existsSync( path.join( ioco.config.datastore.absolutePath ) ) )
          fs.mkdirSync( ioco.config.datastore.absolutePath );
        if( !fs.existsSync( path.join( ioco.config.datastore.absolutePath, 'users' ) ) )
          fs.mkdirSync( path.join( ioco.config.datastore.absolutePath, 'users' ) );
        if( !fs.existsSync( userDirPath ) )
          fs.mkdirSync( userDirPath );
        var origName = path.join( userDirPath, 'profile_orig'+path.extname(fileName) );

        var fileStream = fs.createWriteStream( origName );
        /*
        var file = fs.createWriteStream(filePath, {
        flags: 'w',
        encoding: 'binary',
        mode: 0644
        });*/


        req.streambuffer.ondata( function( chunk ) {
            if( bytesUploaded+chunk.length > (ioco.config.max_upload_size_mb || 5)*1024*1024 ) {
              fileStream.end();
              res.send(JSON.stringify({error: "Too big."}));
            }
            fileStream.write(chunk);
            bytesUploaded += chunk.length;
            req.pause();
            setTimeout(function() { req.resume(); }, PAUSE_TIME);
        });

        req.streambuffer.onend( function() {
          fileStream.end();
          resizeAndCopyImage( origName, userDirPath, function( err ){
            if( err )
              req.flash('error', err );
            else
              req.flash('notice', req.i18n.t('user.picture.upload.ok'));
            res.json({ success: true, flash: req.flash() });
          });
        });

      } // if xhr

    });

    /**
     * save the dimensions of the cropped image
     */
    app.put('/users/:id/change_pic_modal', auth.check, getUser, function( req, res ){
      if( !req.user ) return res.send('user not found');

      var userPicPath = path.join( ioco.config.datastore.absolutePath, 'users', req.user._id.toString() )

      req.user.picCropCoords = {
        x: parseInt(req.body.x),
        y: parseInt(req.body.y),
        w: parseInt(req.body.w),
        h: parseInt(req.body.h)
      };
      req.user.markModified('picCropCoords');
      req.user.save( function(err ){

        if( err ) req.flash('error', err);

        var execStr = ("convert " + path.join(userPicPath, 'profile_150.jpg') + 
          " -crop " + req.body.w + "x" + req.body.h + "+" + 
          req.body.x + "+" + req.body.y + " " + path.join(userPicPath, 'profile.jpg'));
        exec( execStr, function( err ) {
            if (err)
              req.flash('error', err);
            else
              req.flash('notice', req.i18n.t('user.picture.cropped_and_saved') );
            res.render( __dirname + '/views/users/change_pic_modal_update.ejs', {flash: req.flash(), user: req.user} );
        });

      });

    });

    /**
     * return the user's pic
     *
     */
    app.get('/users/:id/pic', getUser, function( req, res ){
      if( !req.user )
        return res.send( 'user not found' )
      var userPicPath = path.join( ioco.config.datastore.absolutePath, 'users', req.user._id.toString() );
      if( req.query.orig && req.query.orig === 'true' )
        userPicPath += '/profile_150.jpg';
      else
        userPicPath += '/profile.jpg';
      if( fs.existsSync( userPicPath ) )
        res.sendfile( userPicPath );
      else
        res.sendfile( path.normalize(__dirname + '/../../../public/images/user_256x256.png') );
    });

    /**
     * lists the users in a json
     * can also be used for autocompletion
     */
    app.get('/users:format?', auth.check, function( req, res ){
      res.format({
        html: function(){
          res.render( ioco.view.lookup( '/users/index.jade' ) );
        },
        json: function(){
          var q = ioco.db.model('User').find();
          if( req.query.online )
            q.where('lastRequest.createdAt').gte( moment().subtract('m', ioco.config.session.timeout.mins ) );
          q.exec( function( err, users ){
            if( err )
              res.json( { error: err } );
            else
              res.json({ data: users, success: (err===null) } );
          });
        }
      });
    });

    /**
     * load friends of currentUser
     */
    app.get('/users/friends.json', auth.check, function( req, res ){

      ioco.db.model('User').find().in('id', res.locals.currentUser.friends).exec( function( err, users ){
        if( err )
          req.flash('error', err);
        if( req.query.include_self )
          users.push( res.locals.currentUser );
        res.json({ success: (err===null), flash: req.flash(), users: users });
      });

    });

    /**
     * SHOW the user
     */
    app.get('/users/:id', auth.checkWithoutRedirect, getUser, function( req, res ){
      res.format({
        html: function(){
          if( !res.locals.currentUser )
            return res.send('alert("login required");');
          if( !req.user )
            return res.send( 'alert("user not found");' );
          res.render( ioco.view.lookup('users/show.jade'), {user: req.user, partialPath: __dirname + '/views/users/show.jade'} );
        },
        json: function(){
          if( !res.locals.currentUser )
            req.user = { name: { full: req.user.name.full }, _id: req.user._id };
          res.json( { user: req.user, success: (req.user !== null ) } );
        }
      });
    });

    /**
     * save changes to profile
     */
    app.put('/users/:id', auth.check, getUser, function( req, res ){
      if( req.user ){
        if( req.body.user.name ){
          req.user.name.nick = req.body.user.name.nick;
          req.user.name.first = req.body.user.name.first;
          req.user.name.last = req.body.user.name.last;
        }
        if( res.locals.currentUser.groups.indexOf('manager') >= 0 && req.body.user.groups )
          req.user.groups = req.body.user.groups;
        if( req.body.user.preferences ){
          req.user.preferences = req.body.user.preferences;
          req.user.markModified('preferences');
        }
        if( req.body.user.sendConfirmationEmail ){
          var confirmationKey = crypto.createHash('sha1').update((new Date()).toString(32)).digest('hex');
          req.user.confirmation = {key: confirmationKey,
                                    expires: moment().add('d',1).toDate(),
                                    tries: 3 };
          req.user.markModified('confirmation');
        }
        req.user.save( function( err ){
          if( err ){
            console.log(err);
            req.flash('error', req.i18n.t('user.saving.failed'));
          } else
            req.flash('notice', req.i18n.t('user.saving.ok'));
          if( req.body.user.sendConfirmationEmail )
            sendConfirmationEmail( req.user, confirmationKey, false, req, res );
          else
            res.json({ success: (err===null), flash: req.flash(), user: req.user });
        });
      } else
        res.json({ success: false, flash: {error: [ req.i18n.t('user.not_found')]}});
    });

    /**
     * edit profile
     */
    app.get('/users/:id/edit', auth.check, getUser, function( req, res ){
      if( req.user ){
        if( res.locals.currentUser.groups.indexOf('manager') >= 0 || req.user._id.toString() === res.locals.currentUser._id.toString() )
          res.render( __dirname + '/views/users/edit.ejs', { partialPath: __dirname + '/views/users/edit.jade', user: req.user } );
        else
          res.send('ioco.notify(\'error\',\'not allowed\');');
      } else
        res.send('ioco.notify(\'error\',\'user not found\');');
    });

    /**
     * shows the change_password dialog
     */
    app.get('/users/:id/change_password_modal', auth.check, getUser, function( req, res ){
      if( req.user ){
        if( res.locals.currentUser.groups.indexOf('manager') >= 0 || req.user._id.toString() === res.locals.currentUser._id.toString() )
          res.render( __dirname + '/views/users/change_password_modal.ejs', { partialPath: __dirname + '/views/users/change_password_modal.jade', user: req.user } );
        else
          res.send('ioco.notify(\'error\',\'not allowed\');');
      } else
        res.send('ioco.notify(\'error\',\'user not found\');');
    });

    /**
     * shows the change_password dialog
     */
    app.put('/users/:id/change_password_modal', auth.check, getUser, function( req, res ){
      if( req.user ){
        if( res.locals.currentUser.groups.indexOf('manager') >= 0 || req.user._id.toString() === res.locals.currentUser._id.toString() )
          if( ( req.body.old_password && req.user.authenticate( req.body.old_password ) ) || (res.locals.currentUser._id.toString() !== req.user._id.toString() && res.locals.currentUser.isAdmin() ) )
            if( req.body.password && req.body.password_confirm && req.body.password == req.body.password_confirm ){
              req.user.password = req.body.password;
              req.user.save( function( err ){
                if( err ) return res.send('ioco.notify(\'error\',\''+ err + '\');');
                res.send('ioco.notify({notice: [\''+ req.i18n.t('user.password_saved') + '\']}); ioco.modal(\'close\');');  
              });
            } else
              res.send('ioco.notify({error: [\''+ req.i18n.t('user.new_passwords_missmatch') + '\']});');
          else
            res.send('ioco.notify({error: [\''+ req.i18n.t('user.password_does_not_match') + '\']});');
        else
          res.send('ioco.notify({error: [\',\'not allowed\']});');
      } else
        res.send('ioco.notify({error: [\',\'user not found\']});');
    });

    app.delete('/users/:id', auth.check, auth.admin, getUser, function( req, res ){
      if( req.user ){
        if( req.user._id.toString() === res.locals.currentUser._id.toString() ){
          req.flash('error', req.i18n.t('user.cannot_remove_yourself'))
          return res.json( { flash: req.flash() } );
        }
        req.user.remove( function( err ){
          if( err )
            req.flash('error', req.i18n.t('user.removing.failed', {name: req.user.name.full})+util.inspect(err) );
          else
            req.flash('notice', req.i18n.t('user.removing.ok', {name: req.user.name.full}) );
          res.json( { flash: req.flash(), success: ( err === null ) } );
        });
      }
    });

    app.post('/users/:id/docklets', auth.check, getUser, function( req, res ){
      if( req.user ){
        console.log('found user');
        if( req.user.preferences.docklets.indexOf( req.body.docklets ) < 0 ){
          console.log("adding")
          req.user.preferences.docklets.push( req.body.docklets );
          req.user.markModified('preferences');
        }
        req.user.save( function( err ){
          if( err ){
            console.log(err);
            req.flash('error', err);
          } else
            req.flash('notice', req.i18n.t('preferences.saved') );
          res.json( {flash: req.flash(), success: (err===null) });
        });
      } else{
        req.flash('error', 'user not found');
        res.json( { success: false } );
      }
    })

  },

  sidebarBottomWidget: true

}

function getUser( req, res, next ){
  ioco.db.model('User').findById( req.params.id, function( err, user ){
    if( err ) return res.send( err );
    req.user = user;
    next();
  })
}

function resizeAndCopyImage( origName, userDirPath, callback ){


  var resizeOpts = { src: origName, dst: path.join( userDirPath, 'profile_150.jpg' ), width: 150, height: 150 };
  easyimg.resize( resizeOpts, function( err, image ){
    util.pump( fs.createReadStream( path.join(userDirPath, 'profile_150.jpg') ),
      fs.createWriteStream(path.join( userDirPath, 'profile.jpg' )),
      callback( err )
    );
  });

}