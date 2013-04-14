/**
 * ioco.kendo-addons.js
 *
 * addons we need in the ioco system to make kendo work
 * smoothly
 *
 * (c) TASTENWERK 2013
 *
 * web: http://iocojs.org
 *
 */
( function(){

  this.kendo.data.binders.css = kendo.data.Binder.extend( {
      refresh: function() {
        if( this.bindings.css ){
          var path = this.bindings.css.path;
          for( var i in path ){
            if( this.bindings.css.source[path[i]]() )
              $(this.element).addClass(i);
            else
              $(this.element).removeClass(i);
          }
        }

      }
  });

})();