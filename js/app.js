/**
 * Main JS for the Random Picker Thingy
 */
(function($, w, undefined) {
  $(document).ready(function() {
    var query = "SELECT DISTINCT member FROM `swdata`";
    var dataURL = 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=tc_data_viz_meetup_commenters&query=' + encodeURI(query) + '&callback=?';
    var $container = $('#random-picker-container-thingy');
    var templateLoading = $('#template-loading').html();
    var templateSquare = $('#template-square').html();
    var w = $container.width();
    var h = $container.height();
    var colors = ['#3366FF', '#6633FF', '#CC33FF', '#FF33CC', '#33CCFF', '#003DF5', '#002EB8', '#FF3366', '#33FFCC', '#B88A00', '#F5B800', '#FF6633', '#33FF66', '#66FF33', '#CCFF33', '#FFCC33'];
    var colorIndex = 0;
    
    // Function to get random integer
    var randomInt = function(min, max) {
      return Math.floor((Math.random() * ((max + 1) - min)) + min);
    };
    
    // Function to get color
    var getColor = function() {
      colorIndex += 1;
      if (colorIndex > colors.length) {
        colorIndex = 0;
      }
      return colors[colorIndex];
    };
    
    // Mark as loading
    $container.html(_.template(templateLoading, {}));
    
    // Get data and process
    $.getJSON(dataURL, function(data) {
      var total = data.length;
      var columns = Math.ceil(Math.sqrt(total));
      var rows = Math.ceil(total / columns);
      
      $container.html('');
      data = _.map(data, function(d, i) {
        d.width = w / columns;
        d.height = h / rows;
        d.color = getColor();
        
        $container.prepend(_.template(templateSquare, d));
        return d;
      });
    });
  });
})(jQuery, window);