/*
 * ioco
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 * content management system by TASTENWERK
 *
 */

var fs = require('fs')
  , path = require('path')
  , stylus = require('stylus')
  , i18next = require('i18next')
  , express
  , MongoSessionStore
  , expressValidator = require('express-validator');

var ioco = {

  /**
   * config (can be set via the config/settings.json file or on runtime)
   */
  config: require( __dirname + '/config' ),

  /**
   * returns the current version of ioco
   */
  version: require( __dirname + '/version' ),

  /**
   * the flash messageing system
   */
  flash: require( __dirname + '/flash' ),

  /**
   * the connection to the database adapter
   */
  db: require( __dirname + '/db' ),

  /**
   * logging
   */
  log: require( __dirname + '/log' ),

  /**
   * plugins for ioco
   */
  plugins: {},

  /**
   * schema plugins (for models)
   *
   * @param {String} - the plugin to load
   *
   */
  getSchemaPlugin: function getSchemaPlugin( name ){
    return require( __dirname + '/db/plugins/'+ name.toLowerCase() + '_idiom' );
  },

  /**
   * initializes ioco
   */
  initModels: function initIoco(){
    require( __dirname + '/../app/models/user' );
    require( __dirname + '/../app/models/label' );
    require( __dirname + '/../app/models/notification' );
    require( __dirname + '/../app/models/file' );
  },

  /**
   * injects expressjs app with ioco plugin eco-system
   *
   * this function should be called from express.js app.js
   * and should be loaded right after bodyParser has been loaded
   *
   * @param [express] - expressjs object
   * @param [app] - the app object
   * @param [io] - the socket.io object (if initialized)
   *
   */
  inject: function loadPlugins( _express, app, io ){

    express = _express;

    // use app's static files and routes first
    app.use( stylus.middleware( process.cwd() + '/public' ) );
    app.use( express.static( process.cwd() + '/public' ) );

    i18next.init({
        resGetPath: __dirname + '/../locales/__lng__/__ns__.json',
        fallbackLng: 'de',
        saveMissing: true,
        dynamicLoad: true
    });
    
    app.set('view engine', 'jade');
    app.engine('jade', require('jade').__express);
    app.engine('ejs', require('ejs').__express);

    app.use(express.bodyParser());
    app.use(expressValidator); // VALIDATOR

    app.use(express.cookieParser(new Date().getTime().toString(36)));

    if( process.env.NODE_ENV && process.env.NODE_ENV === 'test' ){
      app.use( express.session('test') );
    } else {
      
      MongoSessionStore = require('connect-mongo')(express);    
    
      // connect-mongo session store
      app.use(
        express.session({
          secret: ioco.config.session.secret || 'ioco',
          store: new MongoSessionStore({
            mongoose_connection: ioco.db.connection.adapter.orig.connections[0],
            collection: 'ioco_sessions'
          })
        })
      );

      app.use( express.csrf() );

    }

    var pluginsPath = __dirname + '/plugins';
    fs.readdirSync( pluginsPath ).forEach( function( dirName ){
      var plugin = require( path.join( pluginsPath, dirName ) );
      plugin.name = dirName;
      plugin.relativePath = path.join( pluginsPath, dirName );
      ioco.registerPlugin( plugin );
    });

    // get plugins from app (maybe they override some of the defaults)
    var appPluginsPath = process.cwd() + '/../app/plugins';
    if( fs.existsSync(appPluginsPath) )
      fs.readdirSync( appPluginsPath ).forEach( function( dirName ){
        var plugin = require( path.join( appPluginsPath, dirName ) );
        plugin.name = dirName;
        plugin.relativePath = path.join( appPluginsPath, dirName );
        ioco.registerPlugin( plugin );
      });

    app.use(i18next.handle);
    i18next.registerAppHelper(app);
    
    ioco.loadPluginStatics( app, __dirname + '/../public' );
    ioco.loadPluginMiddleware( app );
    if( typeof( io ) !== 'undefined' )
      ioco.loadPluginSocketware( io );

    this.initializeAppPaths( app, io );
    
    ioco.loadPluginRoutes( app );
    ioco.loadPluginStatics( app );


    app.use( express.favicon( __dirname + '/../public/favicon.ico' ));
    app.get('/admin', ioco.plugins.auth.check, function( req, res ){ res.render( __dirname + '/../app/views/index', {title: ioco.config.site.title+'|tas10box'} ); } );

  
    app.use( express.favicon( process.cwd() + '/public/favicon.ico' ));

    app.use(_express.methodOverride());
    app.use(app.router);

  },

  /**
   * initializes the current app's /app paths
   *
   * this routine tries to guess and check if there are
   * any routes, views and models defined
   * and loads them if valid
   *
   * @param {Object} - app
   * @param {Object} - io
   *
   * @api private
   */
  initializeAppPaths: function initializeAppPaths( app, io ){
    var modelsPath = path.join( process.cwd(), 'app', 'models' );
    if( fs.existsSync( modelsPath ) )
      fs.readdirSync( modelsPath ).forEach( function( pth ){
        if( path.extname(pth) === '.js' )
          require( path.join( modelsPath, pth ) );
      });

    var mwPath = path.join( process.cwd(), 'app', 'middleware' );
    if( fs.existsSync( mwPath ) )
      fs.readdirSync( mwPath ).forEach( function( pth ){
        if( path.extname(pth) === '.js' )
          require( path.join( mwPath, pth ) )( app );
      });

    var routesPath = path.join( process.cwd(), 'app', 'routes' );
    if( fs.existsSync( routesPath ) )
      fs.readdirSync( routesPath ).forEach( function( pth ){
        if( path.extname(pth) === '.js' )
          require( path.join( routesPath, pth ) )( app );
      });

    ioco.view.paths = [ process.cwd() + '/app/views' ].concat( ioco.view.paths );

  },

  view: {

    paths: [],

    /**
     * iterate through the ioco.view.paths
     * if the given relative path matches
     * with them.
     *
     * @param {String} [relPath] the relative path that
     * is expected to be in one of the defined view.paths
     *
     * @returns {String} [absPath] the absolute path which
     * can be passed to expressjs' res.render.
     *
     * @example
     *  res.render( ioco.view.paths('/auth/login.jade'), {flash: 'please log in'} );
     */
    lookup: function( relPath, noError ){
      var found;
      for( var i=0, pth; pth = ioco.view.paths[i]; i++ ){
        var absPth = path.join( pth, relPath );
        if( fs.existsSync( absPth ) )
          return (found = absPth);
      }
      ioco.log.info('using view', found);
      if( found ) return found;
      if( noError )
        return;
      throw( new Error('could not find template '+ relPath +' in any of the provided views ('+ioco.view.paths.join(',')+')') );
    }

  },

  /**
   * registers an ioco plugin
   *
   * a plugin can either be a collection of plugins where
   * the collection's keys are the plugin's names (will override .name)
   * or a single plugin where .name is defined
   *
   * @param {object} [app] - the expressjs application object
   * @param {object} [plugin] - the plugin or collection of plugins to be registered.
   * the plugin can also be a string. In that case, ioco can also store the location
   * of the plugin and determine paths and locations much better (e.g. for the ioco-pagedesigner)
   * public/javascript locations [recommended]
   *
   * @example
   *  { name: 'myplugin',
   *    routes: function( app ){ // routes as described in expressjs },
   *    middleware: function( app ){ // middleware as described in expressjs },
   *    docklets: [ array, of, <dockletName>s, to, be, expected, in, 'views/<pluginName>/docklets/<dockletName>'],
   *    statics: [ public: 'path/to/public/path/to/be/added', javascripts: 'path/to/javascripts' ],
   *    views: absolutePathToAdditionaViewsDir,
   *    translations: absolutePathToTranslationsFile,
   *    sidebarWidget: true // will be listed in sidebar, also: { url: 'url/to/widget.html', icon: 'url/to/img' } are possible
   *    allowedGroups: [ array, of, userRoles, allowed, to, access, this, plugin ]
   *  }
   *
   * @example of more than one plugin within a plugin folder
   *  { myplugin1: {
   *      routes: //routes as described above,
   *      middleware: // middleware as described above
   *    },
   *    myplugin2: {
   *      routes: //routes as described above
   *    }
   *  }
   *
   */
  registerPlugin: function registerPlugin( app, plugin ){

    // external plugin loads with (app, plugin)
    if( arguments.length === 2 ){

      // loads a plugin from a given string.
      if( typeof( plugin ) === 'string' ){
        filename = plugin;
        plugin = require(filename).ioco.plugins;
        for( var pluginName in plugin ){
          if( filename.indexOf('/') >= 0 )
            plugin[pluginName].__filePath = filename;
          else
            plugin[pluginName].__modulePath = require.resolve(filename);
          plugin[pluginName].name = pluginName;
          this._registerPlugin( app, plugin[pluginName] );
        }
      }

      if( !plugin.name )
        for( var pluginName in plugin ){
          plugin[pluginName].name = pluginName;
          this._registerPlugin( app, plugin[pluginName] );
        }
      else
        this._registerPlugin( plugin );

    } else {
      // internal plugin loads without just (plugin)

      plugin = app;
      if( plugin.name )
        if( plugin.disabled )
          ioco.log.info('[INTERNAL PLUGIN] ['+plugin.name+'] DISABLED !!!');
        else
          ioco.plugins[plugin.name] = plugin;

    }

  },

  /**
   * internal register function called from
   * ioco.registerPlugin
   */
  _registerPlugin: function _registerPlugin( app, plugin ){

    this.plugins[plugin.name] = plugin;

    if( plugin.depends )
      for( var i in plugin.depends )
        if( !this.plugins[plugin.depends[i]] )
          ioco.registerPlugin( app, plugin.depends[i] );
      
    if( plugin.disabled ){
      ioco.log.info('[PLUGIN] ['+plugin.name+'] DISABLED !!!');
      return;
    }

    if( plugin.middleware )
      plugin.middleware( app );

    if( plugin.routes )
      this.loadPluginRoutes( app, plugin );

    if( plugin.statics )
      this.loadPluginStatics( app, plugin.statics.public );

    if( plugin.views )
      this.view.paths = [ plugin.views ].concat( this.view.paths );

    if( plugin.viewPaths )
      for( var i in plugin.viewPaths )
        ioco.view.paths.push( plugin.viewPaths[i] );
      
    ioco.log.info('[PLUGIN] ['+plugin.name+'] registered');

  },

  loadPluginMiddleware: function loadPluginMiddleware( app ){

    for( var i in ioco.plugins ){
      var plugin = ioco.plugins[i];
      if( plugin.middleware )
        plugin.middleware( app );
    }

  },

  loadPluginSocketware: function loadPluginSocketware( io ){

    for( var i in ioco.plugins ){
      var plugin = ioco.plugins[i];
      if( plugin.socketware )
        plugin.socketware( io );
    }

  },

  loadPluginRoutes: function loadPluginRoutes( app, plugin ){

    if( arguments.length === 2 ){
      this._loadPluginRoutes( app, plugin );
    } else {
      for( var i in ioco.plugins ){
        var plugin = ioco.plugins[i];
        this._loadPluginRoutes( app, plugin );
      }
    }

  },

  _loadPluginRoutes: function _loadPluginRoutes( app, plugin ){

    if( plugin.routes )

      if( typeof(plugin.routes) === 'function' )

        plugin.routes( app );

      else if( typeof(plugin.routes) === 'string' ){

        fs.readdirSync( plugin.routes ).forEach( function( routeFile ){

            if( routeFile.indexOf('index') < 0 )
              require( path.join(plugin.routes, routeFile ) )( app );

          });

      }

    },

  loadPluginStatics: function loadPluginStatics( app, dirname ){

    function loadPluginPublic( path ){
      var stats = require('fs').lstatSync( path );
      if( stats.isDirectory() ){
        ioco.log.info('[PLUGIN] PUBLIC PATH: ' + path + ' added.');
        app.use( stylus.middleware( path ) );
        app.use( express.static( path ) );
      }
    }

    if( dirname )
      loadPluginPublic( dirname );
    else
      for( var i in ioco.plugins ){
        var plugin = ioco.plugins[i];
        if( plugin.statics ){
          if( plugin.statics.public )
            loadPluginPublic( plugin.statics.public );
        }
      }

  },

  sendMail: require( __dirname + '/sendmail'),

  filetools: require( __dirname + '/plugins/files/tools' ),

  port: function(){
    var hostname = require(__dirname+'/config').hostname;
    return( hostname && hostname.split(':').length === 3 ? hostname.split(':')[2] : 3000 );
  }()


};

module.exports = exports = ioco;