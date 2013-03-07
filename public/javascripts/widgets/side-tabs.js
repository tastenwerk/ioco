/**
 * side-tabs
 * lets you add a tabbed sidebar
 *
 */

$(function(){

  $.fn.iocoSideTabs = function iocoSideTabs( options ){

    var sidetabs = this;

    $(sidetabs).find('.side-tabs-nav li').on('click', function(){
      $(this).closest('ul').find('.active').removeClass('active');
      $(sidetabs).find('.side-tabs-content > div').hide();
      $($(sidetabs).find('.side-tabs-content > div')[$(this).index()]).show();
      $(this).addClass('active');
    }).first().click();

  }

});