module.exports = exports = function( req, res, next ){

  if( req.flash )
    return next();

  /**
   * simple flash system
   *
   * setting a flash message:
   * req.flash('error', 'my error message' );
   *
   * getting a flash message:
   * req.flash('error');
   *
   * getting a flash message and persist message
   * req.flash('error', true);
   *
   * getting full flash as json
   * req.flash();
   *
   * @param {String} [type] - the type of the message (error,notice)
   * @param {String,Boolean} [msg] - the message or a boolean if
   * getting the message should not remove the message.
   *
   * @returns {Array} an array of messages stored in
   * the session.flash object
   *
   */
  req.flash = function( type, msg ){

    var msgs = this.session.flash = this.session.flash || {}
      , rmsg = msgs[type];

    if( arguments.length === 0 ){
      rmsg = msgs;
      this.session.flash = {};
      return rmsg;
    }

    if( type && msg && typeof(msg) === 'string' )
      return (msgs[type] = msgs[type] || []).push(msg);

    if( typeof(msg) !== 'boolean' )
      delete msgs[type];

    return rmsg || [];

  }

  next();

};