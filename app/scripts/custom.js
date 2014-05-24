/*global $:false */
'use strict';

$(function() {

  $(document).on('mouseover', '.distance', function(){
    var e=$(this);
    e.popover({
      trigger: 'focus'
    });
    e.popover('show');
  });

  $(document).on('mouseout', '.distance', function(e){
    var me = $(this);
    if(e.toElement.classList[0] === 'ng-binding' || e.toElement.classList[0] === 'row'){
      me.popover('hide');
    }
  });

  $(document).on('mouseleave', '.popover', function(){
    $(this).fadeOut(250);
  });
  
});