/**
 * Main JS for the Random Picker Thingy
 */
(function($, w, undefined) {
  var query = "SELECT DISTINCT member FROM `swdata`";
  var dataURL = 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=tc_data_viz_meetup_commenters&query=' + encodeURI(query) + '&callback=?';
  
  //var colors = ['#3366FF', '#6633FF', '#CC33FF', '#FF33CC', '#33CCFF', '#003DF5', '#002EB8', '#FF3366', '#33FFCC', '#B88A00', '#F5B800', '#FF6633', '#33FF66', '#66FF33', '#CCFF33', '#FFCC33'];
  //var colors = ['#3366FF', '#6633FF', '#CC33FF', '#FF33CC'];
  //var colors = ['#3366FF', '#33CCFF', '#003DF5', '#668CFF', '#66D9FF', '#295EFF', '#6188FF', '#00ACE6'];
  var colors = ['#90CA77', '#81C6DD', '#E9B64D', '#E48743', '#9E3B33'];
  //var colors = ['#4D8963', '#69A583', '#E1B378', '#E0CC97', '#EC799A', '#9F0251'];
  //var colors = ['#AD0066', '#D13D94', '#F5851F', '#CADA2A', '#81A4B9', '#CFE8F6'];
  
  var colorsUsed = [];
  var conf = {
    dataMultiplier: 4,
    matchLimitLower: 1,
    matchLimitUpper: 1,
    waitUpper: 300,
    waitLower: 210,
    fadeTime: 180,
    finishBackgroundTileTime: 1000,
    finishTileTime: 100,
    goBackgroundTime: 500
  };
  var exceptions = ['Alan Palazzolo', 'bryan kennedy', 'Kristina Durivage'];
  var randomURL = 'http://random-proxy.herokuapp.com/integers/?num=1&min=0&max=[[[MAX]]]&col=1&base=10&format=plain&rnd=new&callback=?';
  
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
      var data;
      var $entry = this.$el.find('.entry');
      
      if ($entry.size() > 0) {
        $entry.attr({
          'data-cid': this.model.cid,
          'data-member': this.model.get('member')
        })
        .animate({
          backgroundColor: this.model.get('color')
        }, conf.fadeTime);
      }
      else {
        data = this.model.toJSON();
        data.cid = this.model.cid;
        $cell = $(_.template(this.templates.entry, data)).hide();
        this.$el.html($cell);
        $cell.fadeIn(conf.fadeTime, 'swing');
      }
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
      this.templates.checkData = $('#template-check-data').html();
      
      this.startLoading();
      this.getData();
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
        thisView.checkData();
      });
    },
    
    checkData: function() {
      var thisView = this;
      var go, $go;
      
      this.$el.html(_.template(this.templates.checkData, { c: this.collection.toJSON() }));
      $go = this.$el.find('.go-go-go');
      
      go = w.setInterval(function() {
        $go.animate({
          backgroundColor: thisView.collection.at(randomInt(0, thisView.collection.length - 1)).get('color')
        }, (conf.goBackgroundTime - (conf.goBackgroundTime * .1)));
      }, conf.goBackgroundTime);
      
      $go.click(function(e) {
        e.preventDefault();
        clearTimeout(go);
        
        thisView.$el.html('');
        thisView.multiplyData();
        thisView.setGrid();
        thisView.getRandom();
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
    
    setGrid: function() {
      this.width = $(this.el).width();
      this.height = $(this.el).height();
      this.columns = Math.ceil(Math.sqrt(this.collection.length));
      this.rows = Math.ceil(this.collection.length / this.columns);
      this.cellWidth = 100 / this.rows;
      this.cellHeight = 100 / this.columns;
    },
    
    getRandom: function() {
      var thisView = this;
      
      this.randomWinner = null;
      randomURL = randomURL.replace('[[[MAX]]]', this.collection.length - 1);
      $.getJSON(randomURL, function(data) {
        if (data.error !== true) {
          thisView.randomWinner = parseInt(data.response);
        }
      });
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
      var winner = this.randomWinner;
      var counter = 0;
      var thisView = this;

      // See if we got a number from random.org
      if (winner === null) {
        console.log('randommmming');
        winner = this.collection.at(randomInt(0, this.collection.length - 1));
      }
      winner = this.collection.at(winner);

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
        
        w.setInterval(function() {
          $container.animate({
            backgroundColor: thisView.collection.at(randomInt(0, thisView.collection.length - 1)).get('color')
          }, (conf.goBackgroundTime - (conf.goBackgroundTime * .1)));
        }, conf.goBackgroundTime);
        
      }, conf.finishTileTime * (counter + 1));
    }
  });

  // Kick things off
  $(document).ready(function() {
    var gridApp = new Grid({
      el: '#random-picker-container-thingy'
    });
  });
})(jQuery, window);