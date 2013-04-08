var ioco = require( __dirname + '/../../ioco')
  , moment = require('moment');

// append view path so they can be overridden
ioco.view.paths.push( __dirname + '/views' );

/**
 * get remote ip
 */
function remoteIp( req ){
  var ipAddress = null;
  if(req.headers['x-forwarded-for'])
    ipAddress = req.headers['x-forwarded-for'];
  else
    ipAddress = req.connection.remoteAddress;
  return ipAddress;
}

/**
 * try to login in the user
 * by looking up the database
 * for any matches with email and
 * hashed password
 */
function tryLoginUser( req, res, next ){
  ioco.db.model( 'User' ).findOne().or([ {email: req.body.email }, {'name.nick': req.body.email} ]).exec( function( err, user ){
    if( err ) req.flash('error', err);
    if( user && user.authenticate( req.body.password ) ){
      if(user.loginLog.length > 30)
        user.loginLog = user.loginLog.slice(0,30);
      user.loginLog.push( {ip: remoteIp( req ) } );
      user.lastRequest = { createdAt: new Date(), ip: remoteIp( req ) };
      user.save( function( err ){
        if( err ) req.flash('error', err);
        if( user ){
          req.session.userId = user.id.toString();
          req.session.userIp = remoteIp( req );
          res.locals.currentUser = user;
        }
        next();
      })
    } else {
      req.flash('error', req.i18n.t('user.login_failed'));
      next();
    }
  });
}

function redirectLogin( req, res ){

  if( req.redirectLogin )
    if( typeof(req.redirectLogin) === 'function' )
      req.redirectLogin( req, res );
    else
      res.redirect( req.redirectLogin );
  else{
    if( req.xhr )
      res.send(401)
    else
      res.redirect('/login');
  }
}

module.exports = exports = {

  remoteIp: remoteIp,
  
  tryLoginUser: tryLoginUser,
  
  check: function( req, res, next ){
    ioco.db.model( 'User' ).findById( req.session.userId, function( err, user ){
      if( err ) req.flash('error', err );
      if( user ){
        req.user = user;
        if( user.lastRequest.createdAt.getTime() > moment().subtract('m', ioco.config.session.timeout.mins ) ){
          user.lastRequest.createdAt = new Date();
          user.save( function( err ){
            if( err ) req.flash('error', err );
            res.locals.currentUser = user;
            next();
          })
        } else {
          req.session.userId = null;
          req.session.userIp = null;
          req.flash('error', req.i18n.t('user.session_timeout', {timeout: ioco.config.session.timeout.mins}));
          redirectLogin( req, res );
        }
      } else {
        req.flash('error', req.i18n.t('user.login_required') );
        redirectLogin( req, res );
      }
    });
  },

  admin: function( req, res, next ){
    if( res.locals.currentUser && res.locals.currentUser.groups.indexOf('manager') >= 0 )
      return next();
    res.send(403);
  },

  checkWithoutRedirect: function( req, res, next ){
    ioco.db.model( 'User' ).findById( req.session.userId, function( err, user ){
      if( err ) req.flash('error', err );
      if( user ){
        req.user = user;
        if( user.lastRequest.createdAt.getTime() > moment().subtract('m', ioco.config.session.timeout.mins ) ){
          user.lastRequest.createdAt = new Date();
          user.save( function( err ){
            if( err ) req.flash('error', err );
            res.locals.currentUser = user;
            next();
          })
        } else
        next();
      } else
        next();
    });
  },

  routes: function( app ){

    app.get('/login', this.checkWithoutRedirect, function( req, res ){

      ioco.db.model('User').find({}, function( err, users ){
        if( users.length === 0 )
          return res.redirect('/ioco-initial-setup');

        if( res.locals.currentUser )
          return res.redirect('/admin');
        res.render( ioco.view.lookup( 'auth/login.jade' ), { flash: req.flash() } );
      });

    });

    app.get('/logout', function( req, res ){
      req.session.userId = null;
      req.session.userIp = null;
      res.render( ioco.view.lookup( 'auth/login.jade' ), { flash: { notice: [ req.i18n.t('user.logged_off') ] } } );
    });

    app.get('/forgot_password', function( req, res ){
      res.render( ioco.view.lookup( 'auth/forgot_password.jade' ), { flash: {} } );
    });

    app.post('/reset_password', function( req, res ){
      var crypto = require('crypto');
      var confirmationKey = crypto.createHash('sha1').update((new Date()).toString(32)).digest('hex');
      ioco.db.model( 'User' ).findOne( {email: req.body.email}, function( err, user ){
        if( user ){
          user.update({ confirmation: { key: confirmationKey,
                                        expires: moment().add('d',1).toDate(),
                                        tries: 3 } }, function( err ){
            if( err ){
              req.flash('error', err);
              console.log(err);
              res.render( ioco.view.lookup( 'auth/forgot_password.jade' ), { flash: req.flash() } );
            } else {
              ioco.sendMail.deliver({ 
                to: req.body.email,
                subject: '['+ioco.config.site.title+'] '+req.i18n.t('forgot_password.reset_request'),
                text: req.i18n.t('forgot_password.reset_request_text') +
                      "  " + ioco.config.hostname + "/users/"+ user._id + "/reset_password?key=" + confirmationKey +
                      req.i18n.t('bye', {site: ioco.config.site.title})
                }, 
                function( err, response ){
                  if( err ){
                    console.log( err );
                    req.flash('error', err);
                  } else
                    req.flash('notice', req.i18n.t('forgot_password.reset_send'));
                  res.render( ioco.view.lookup( 'auth/login.jade' ), { flash: req.flash() } );
              });
            }

          });
        } else {
          req.flash('error', req.i18n.t('forgot_password.email_not_found') );
          res.render( ioco.view.lookup( 'auth/forgot_password.jade' ), { flash: req.flash() } );
        }
      });
    });

    function setPasswordRoute( req, res ){
      ioco.db.model( 'User' ).findOne( {_id: ioco.db.Schema.Types.ObjectId(req.params.id),
                     'confirmation.key': req.query.key}, function( err, user ){
        if( err ){
          console.log(err);
          req.flash('error', err);
        }
        if( user )
          res.render( ioco.view.lookup( 'auth/set_password.jade' ), { flash: {}, user: user } )
        else{
          req.flash('error', req.i18n.t('forgot_password.key_not_found') );
          res.render( ioco.view.lookup( '/auth/login.jade' ), { flash: req.flash() } )
        }
      });
    }

    app.get('/users/:id/reset_password', setPasswordRoute);
    app.get('/users/:id/confirm', setPasswordRoute);

    app.post('/users/:id/set_password', function( req, res ){
      ioco.db.model( 'User' ).findById( req.params.id, function(err, user){
        if( err ){
          console.log(err);
          req.flash('error', err);
        }
        if( user ){
          if( user.confirmation.key === req.body.key ){
            if( req.body.password && req.body.password_confirm && req.body.password == req.body.password_confirm ){
              user.password = req.body.password;
              user.confirmation.key = null;
              user.save( function( err ){
                if( err ){
                  console.log( err );
                  req.flash( 'error', err )
                } else
                  req.flash('notice', req.i18n.t('forgot_password.reset_finished'))
                return res.render( ioco.view.lookup('/auth/login.jade'), { flash: req.flash() });
              })
            } else {
              req.flash( 'error', req.i18n.t('user.new_passwords_missmatch') )
              return res.rener( ioco.view.lookup('/auth/set_password'), { flash: req.flash(), user: user } )
            }
          } else{
            req.flash('error', 'confirmation key missmatch');
            return res.render( ioco.view.lookup( '/auth/login.jade' ), { flash: {} } )
          }
        } else
          res.render( ioco.view.lookup( '/login' ), { flash: req.flash() } )

      });
    });

    app.post('/login', tryLoginUser, function( req, res ){
      if( res.locals.currentUser )
        //res.render( __dirname + '/../../../app/views/index', {title: ioco.config.site.title+'|tas10box'} );
        res.redirect( '/admin' );
      else
        res.render( ioco.view.lookup( 'auth/login.jade' ), { flash: req.flash() } );
    });

  }

};