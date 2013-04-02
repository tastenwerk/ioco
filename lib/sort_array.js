function sortArray( arr, sortOptions ){
  var sort;
  if( typeof(sortOptions) === 'undefined' || !sortOptions )
    sort = {name: 'asc'};
  else if( sortOptions instanceof String )
    sortOptions.split(' ').forEach( function(so){
      if( so.substring(0,1) === '-' )
        sort[so] = 'desc';
      else
        sort[so] = 'asc';
    })
  else
    sort = sortOptions;
  arr.sort( function( a, b ){
    for( var i in sort )
      if( ( a[i] && b[i] && a[i] < b[i] ) || !a[i] && b[i] )
        return ( sort[i] === 'asc' ? -1 : 1 );
      else if( ( a[i] && b[i] && a[i] > b[i] ) || a[i] && !b[i] )
        return ( sort[i] === 'asc' ? 1 : -1 );
      else
        return 0;
  });
  var a = []
  for( var i in arr )
    a.push( arr[i].name + ':' + arr[i].pos );
  return arr;
};

module.exports = exports = sortArray;