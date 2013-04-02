/**
 * top-tabs
 * lets you add a tabbed topbar
 *
 */

$(function(){

  $.fn.iocoTopTabs = function iocoSideTabs( options ){

    var toptabs = this;

    $(toptabs).find('.top-tabs-nav li:not(.action-nav)').on('click', function(e){
      e.preventDefault();
      var ul = $(this).closest('ul');
      ul.find('.active').removeClass('active');
      $(toptabs).find('.top-tabs-content > div').hide();
      var container = $($(toptabs).find('.top-tabs-content > div')[$(this).index()]);
      container.show().find('.js-get-focus').focus();
      setTimeout(function(){
        container.find('.js-get-focus').focus();
      }, 500);
      $(this).addClass('active');
    }).first().click();

  }

});