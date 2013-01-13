/**
 * Main JS for the Random Picker Thingy
 */
(function($, w, undefined) {
  var query = "SELECT DISTINCT member FROM `swdata`";
  var dataURL = 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=tc_data_viz_meetup_commenters&query=' + encodeURI(query) + '&callback=?';
  //var colors = ['#3366FF', '#6633FF', '#CC33FF', '#FF33CC', '#33CCFF', '#003DF5', '#002EB8', '#FF3366', '#33FFCC', '#B88A00', '#F5B800', '#FF6633', '#33FF66', '#66FF33', '#CCFF33', '#FFCC33'];
  //var colors = ['#3366FF', '#6633FF', '#CC33FF', '#FF33CC'];
  var colors = ['#3366FF', '#33CCFF', '#003DF5', '#668CFF', '#66D9FF', '#295EFF', '#6188FF', '#00ACE6'];
  var colorsUsed = [];
  var conf = {
    dataMultiplier: 1,
    matchLimitLower: 1,
    matchLimitUpper: 1,
    waitUpper: 300,
    waitLower: 250,
    fadeTime: 180,
    finishBackgroundTileTime: 1000,
    finishTileTime: 100
  };
  var exceptions = ['Alan Palazzolo', 'bryan kennedy'];
  
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
      this.set('color', this.pickColorOrder());
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
      var color;
      
      if (colorsUsed.length === colors.length) {
        colorsUsed = [];
      }
      
      index = colorsUsed.length;
      color = colors[index];
      colorsUsed.push(color);
      return color;
    }
  });
  
  // Entry collection
  var Entries = Backbone.Collection.extend({
    model: Entry,
    
    comparator: function(m) {
      return m.cid;
    }
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
        data = thisView.removeExceptions(data);
        thisView.original = data;
        thisView.collection = new Entries(data);
        
        thisView.$el.html('');
        
        thisView.multiplyData();
        thisView.setGrid();
        thisView.makeGrid();
        thisView.fillGrid();
      });
    },
    
    removeExceptions: function(data) {
      var parsed = [];
      _.each(data, function(d, i) {
        if (exceptions.indexOf(d.member) === -1) {
          parsed.push(d);
        }
      });
      
      return parsed;
    },
    
    multiplyData: function() {
      var thisView = this;
      
      for (var i = 1; i < conf.dataMultiplier; i++) {
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
        var limitFound = randomInt(conf.matchLimitLower, conf.matchLimitUpper);
        $cell.attr('data-found-limit', limitFound);
        
        var intervalID = w.setInterval(function() {
          var guess = thisView.collection.at(randomInt(0, thisView.collection.length - 1));
          var entry = new EntryView({
            model: guess,
            el: $cell
          }).render();
          
          if (guess.cid === m.cid) {
            found += 1;
            $cell.attr('data-found', found);
            if (found == limitFound) {
              thisView.collection.get(m.cid).set('matched', true);
              w.clearTimeout(intervalID);
              thisView.testFinish();
            }
          }
        }, randomInt(conf.waitLower, conf.waitUpper));
      });
    },
    
    testFinish: function() {
      var allMatched = true;
      this.collection.each(function(m, i) {
        if (m.get('matched') !== true) {
          allMatched = false;
        }
      });
      
      if (allMatched) {
        this.finish();
      }
    },
    
    finish: function() {
      // This is actually picking the winner.
      var winner = this.collection.at(randomInt(0, this.collection.length - 1));
      var counter = 0;
      var thisView = this;

      this.$el.find('div').each(function() {
        var $this = $(this);
        counter += 1;
        
        w.setTimeout(function() {
          $this.animate({
            backgroundColor: winner.get('color')
          }, conf.finishBackgroundTileTime);
        }, conf.finishTileTime * counter);
      });
      
      w.setTimeout(function() {
        var $container = thisView.$el.find('div.entry[data-cid=' + winner.cid + ']');
        
        $container.css({
          'font-size': $container.height() / 3
        }).html(winner.get('member'));
        
      }, conf.finishTileTime * counter);
    }
  });

  // Kick things off
  $(document).ready(function() {
    var gridApp = new Grid({
      el: '#random-picker-container-thingy'
    });
  });
})(jQuery, window);