/**
 * Main JS for the Random Picker Thingy
 */
(function($, w, undefined) {
  var query = "SELECT DISTINCT member FROM `swdata`";
  var dataURL = 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=tc_data_viz_meetup_commenters&query=' + encodeURI(query) + '&callback=?';
  var colors = ['#3366FF', '#6633FF', '#CC33FF', '#FF33CC', '#33CCFF', '#003DF5', '#002EB8', '#FF3366', '#33FFCC', '#B88A00', '#F5B800', '#FF6633', '#33FF66', '#66FF33', '#CCFF33', '#FFCC33'];
  var colorsUsed = [];
  var conf = {
    dataMultiplier: 4,
    matchLimit: 8,
    waitUpper: 350,
    waitLower: 250,
    fadeTime: 180,
  };
  
  
  
  // Functions to get random things
  var randomInt = function(min, max) {
    return Math.floor((Math.random() * ((max + 1) - min)) + min);
  };
  var randomArrayValue = function(arr) {
    return arr[randomInt(0, arr.length - 1)];
  };
  
  // Model for entry
  var Entry = Backbone.Model.extend({
    initialize: function() {
      this.set('color', this.pickColorRandom());
    },
    
    pickColorRandom: function() {
      var notUsed = false;
      var color;
      
      if (colorsUsed.length === colors.length) {
        colorsUsed = [];
      }
      
      while (!notUsed) {
        color = randomArrayValue(colors);
        if (colorsUsed.indexOf(color) === -1) {
          notUsed = true;
        }
      }
      
      colorsUsed.push(color);
      return color;
    },
    
    pickColorOrder: function() {
      var index;
      
      if (colorsUsed.length === colors.length) {
        colorsUsed = [];
      }
      
      index = colorsUsed.length;
      colorsUsed.push(colors[index]);
      return colors[index];
    }
  });
  
  // Entry collection
  var Entries = Backbone.Collection.extend({
    model: Entry
  });
  
  // Entry view
  var EntryView = Backbone.View.extend({
    model: Entry,
    
    initialize: function() {
      this.templates = this.templates || {};
      this.templates.entry = $('#template-entry').html();
    },
    
    render: function() {
      var data = this.model.toJSON();
      data.cid = this.model.cid;
      $cell = $(_.template(this.templates.entry, data)).hide();
      this.$el.html($cell);
      $cell.fadeIn(conf.fadeTime, 'swing');
      return this;
    }
  });
  
  // Grid view
  var Grid = Backbone.View.extend({
    collection: Entries,
    
    initialize: function() {
      this.templates = this.templates || {};
      this.templates.loading = $('#template-loading').html();
      this.templates.cell = $('#template-cell').html();
      
      this.startLoading();
      this.getData();
    },
    
    setGrid: function() {
      this.width = $(this.el).width();
      this.height = $(this.el).height();
      this.columns = Math.ceil(Math.sqrt(this.collection.length));
      this.rows = Math.ceil(this.collection.length / this.columns);
      this.cellWidth = 100 / this.rows;
      this.cellHeight = 100 / this.columns;
    },
    
    startLoading: function() {
      this.$el.html(_.template(this.templates.loading, {}));
    },
    
    getData: function() {
      var thisView = this;
      
      $.getJSON(dataURL, function(data) {
        thisView.original = data;
        thisView.collection = new Entries(data);
        
        thisView.$el.html('');
        
        thisView.multiplyData();
        thisView.setGrid();
        thisView.makeGrid();
        thisView.fillGrid();
      });
    },
    
    multiplyData: function() {
      var thisView = this;
      
      for (var i = 0; i < conf.dataMultiplier; i++) {
        this.collection.each(function(m, i) {
          thisView.collection.push(m.toJSON());
        });
      };
    },
    
    makeGrid: function() {
      var thisView = this;
      
      this.collection.each(function(m, i) {
        thisView.$el.prepend(_.template(thisView.templates.cell, {
          width: thisView.cellWidth,
          height: thisView.cellHeight,
          cid: m.cid,
          color: m.get('color')
        }))
      });
    },
    
    fillGrid: function() {
      var thisView = this;
      
      this.collection.each(function(m, i) {
        var $cell = thisView.$el.find('div[data-cid=' + m.cid + ']');
        var found = 0;
        var limitFound = randomInt(1, conf.matchLimit);
        $cell.attr('data-found-limit', limitFound);
        
        var intervalID = w.setInterval(function() {
          var guess = thisView.collection.at(randomInt(0, thisView.collection.length - 1));
          var entry = new EntryView({
            model: guess,
            el: $cell
          }).render();
          
          if (guess.get('member') === m.get('member')) {
            found += 1;
            $cell.attr('data-found', found);
            if (found == limitFound) {
              w.clearTimeout(intervalID);
            }
          }
        }, randomInt(conf.waitLower, conf.waitUpper));
      });
    }
  });

  // Kick things off
  $(document).ready(function() {
    var gridApp = new Grid({
      el: '#random-picker-container-thingy'
    });
  });
})(jQuery, window);