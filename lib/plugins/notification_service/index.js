// ioconal modules
var auth = require( __dirname + '/../auth' )
  , iomapper = require('iomapper')
  , User = iomapper.mongoose.models.User
  , moment = require('moment')
  , ioco = require( __dirname + '/../../../index');

//ioco.view.paths = [ __dirname + '/views' ].concat( ioco.view.paths );

function getKeys( req, res, next ){
  req.keys = [ res.locals.currentUser._id.toString(),
               User.anybodyId.toString(),
               User.everybodyId.toString() ];
  next();
}

var notificationServicePlugin = {

  routes: function(app){ 

    app.get('/notification_service.:format?', auth.check, getKeys, function( req, res ){

      res.format({
        json: function(){
          iomapper.mongoose.models.Notification.find().in( 'read', req.keys ).populate('_creator').populate('_affectedUser').sort({ createdAt: -1 }).exec( function( err, notifications ){
            if( err ){
              console.log('err:', err);
              req.flash('error', err);
              return res.json({ success: false, flash: req.flash() })
            }
            res.json( { success: true, data: notifications } );
          });
        },
        html: function(){
          res.render( __dirname + '/views/notification_services/show.jade' );
        }
      });

    });

    /**
     * the messages docklet
     * as a dashboard plugin
     */
    app.get('/notification_service/docklets/summary', auth.check, getKeys, function( req, res ){
      iomapper.mongoose.models.Notification.find().in( 'read', req.keys ).gte( 'createdAt', moment().sod().toDate() ).exec( function( err, notifications ){
        res.render( __dirname + '/views/notification_services/docklets/summary', { notificationsToday: notifications } );
      })
    });

    /**
     * a simple clock docklet
     */
    app.get('/notification_service/docklets/clock', auth.check, function( req, res ){
      res.render( __dirname + '/views/notification_services/docklets/clock' );
    });

    /**
     * posting a message to the
     * messages docklet
     */
    app.post('/notification_service/docklets/messages', auth.check, function( req, res ){
      var currentUser = res.locals.currentUser;
      if( currentUser.preferences.docklets && currentUser.preferences.docklets instanceof Array )
        if( currentUser.preferences.docklets.indexOf( req.body.docklets ) < 0 )
          currentUser.preferences.docklets.push( req.body.docklets );
      else
        currentUser.preferences.docklets = (req.body.docklets instanceof Array ? req.body.docklets : [ req.body.docklets ]);
      currentUser.markModified('preferences');
      currentUser.save( function( err ){
        console.log('inside', err);
        if( err )
          req.flash('error', err);
        else
          req.flash('notice', req.i18n.t('user.docklets_settings_saved') );
        res.render( __dirname + '/views/users/update.ejs', {flash: req.flash()} );
      })
    });

  },

  docklets: ['summary', 'clock'],

  sidebarWidget: {
    limitSearch: [ 'Notification' ]
  },


  socketware: function( io ){

    io
      .set('log level', 1)
      .of('/mainStream')
      .on('connection', function (socket) {
      socket.on( 'postMessage', function (data) {
        User.findById( iomapper.mongoose.Types.ObjectId( data.userId ), function( err, user ){
          if( err || !user ) return;
          var notification = new iomapper.mongoose.models.Notification( { message: data.message, _creator: user, type: 'Message' } );
          notification.read.push( iomapper.mongoose.models.User.anybodyId );
          notification.save( function( err ){
            if( err )
              socket.emit( 'updateStream', { success: false, flash: {error: [ err ] } } );
            else{
              var safeNot = notification.toObject();
              safeNot._creator = user.toObject();
              io.of('/mainStream').emit( 'updateStream', safeNot );
            }
          });
        });
      });
    });

    // extend Notification model
    iomapper.mongoose.models.Notification.schema.post( 'save', function(notification){
      if( notification.type !== 'Message' )
        io.of('/mainStream').emit( 'updateStream', notification );
    });

  }

}

module.exports = exports = notificationServicePlugin;