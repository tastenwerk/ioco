$(function(){

  function toggleDropdown(){
    $(this).closest('.dropdown').find('.dropdown-menu').toggle(300);
  }

  $('.dropdown [data-toggle=dropdown]').live('click', function(e){
    e.preventDefault();
    var self = this;
    if( $(this).attr('data-remote') && $(this).attr('href').length > 0 )
      $(this.closest('.dropdown').load( $(this).attr('href') ), function(){
        toggleDropdown.call( self );
      });
    else
      toggleDropdown.call( self );
  });
});
