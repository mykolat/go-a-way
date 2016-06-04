// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
var tmpl = function() {
  var cache = {};

  return {
    render: function(str, data) {
      // Figure out if we're getting a template, or if we need to
      // load the template - and be sure to cache the result.
      var fn = !/\W/.test(str) ?
        cache[str] = cache[str] ||
        tmpl.render(document.getElementById(str).innerHTML) :

        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        new Function("obj",
          "var p=[],print=function(){p.push.apply(p,arguments);};" +

          // Introduce the data as local variables using with(){}
          "with(obj){p.push('" +

          // Convert the template into pure JavaScript
          str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'") + "');}return p.join('');");

      // Provide some basic currying to the user
      return data ? fn(data) : fn;
    }
  };
}();

$(function() {

  /* trips list */
  var tripsModel = {
    trips: [{
      name: "Peru & Chile",
      url: 'trip.html'
    }, {
      name: "Lviv"
    }, {
      name: "Kyiv-Odesa"
    }]
  };
  var trips = document.getElementById("trips");
  if (trips) {
    trips.innerHTML = tmpl.render("tripsTmpl", tripsModel);
  }

  /* points list */
  var pointsModel = {
    points: [{}, {
      isVisited: true
    }, {
      isVisited: true,
      isSelected: true
    }, {
      isCurrent: true
    }, {}, {}, {}, {}]
  };
  var pointsSlider = document.getElementById("points-slider");
  if (pointsSlider) {
    pointsSlider.innerHTML = tmpl.render("pointsSliderTmpl", pointsModel);
    var pointsScroll = new IScroll('#points-slider', {});

    $('#points-slider li').click(function() {
      var currentPointIndex = $(this).index();
      $('#points-slider li').removeClass('selected');
      $(this).addClass('selected');
      $('.point').hide();
      $($('.point').eq(currentPointIndex)).show();
    });
  }

  /* points */
  var points = document.getElementById("points");
  if (points) {
    points.innerHTML = tmpl.render("pointsTmpl", pointsModel);
  }

  /* point carousel */
  $('.point-carousel .carousel-indicators li').click(function() {
    var context = $(this).parents('.point-carousel ');
    context.find('.carousel-indicators li').removeClass('selected');
    $(this).addClass('selected');
  });

  $('.point-carousel').on('slide.bs.carousel', function(e) {
    var context = $(e.relatedTarget).parents('.point-carousel');
    context.find('.carousel-indicators li').removeClass('selected');
    var activeSlideIndex = $(e.relatedTarget).index();
    context.find('.carousel-indicators li').eq(activeSlideIndex).addClass('selected');
  })

});

$(document).ready(function() {

  var LocsD = [{
      lat: 49.831521,
      lon: 24.037718,
      title: 'Lviv',
      html: '<h3>Lviv, Ukraine</h3',
      zoom: 6,
      icon: "img/icon-home-pin-big.png"
    }, {
      lat: 50.4368089,
      lon: 30.4718952,
      title: 'Kyiv, Ukraine',
      html: '<h3>Kyiv, Ukraine</h3>',
      icon: "img/icon-visited-pin-big.png"
    }, {
      lat: 48.13654,
      lon: 11.57706,
      title: 'Munich, Germany',
      html: '<h3>Munich, Germany</h3>',
      icon: "img/icon-current-pin-big.png"
    }, {
      lat: 48.8589507,
      lon: 2.2775168,
      title: 'Draggable',
      html: '<h3>Content B1</h3>',
      // draggable: true
      icon: "img/icon-scheduled-pin-big.png",
      strokeColor: '#FF0000'
    }],
    directions = new Maplace({
      locations: LocsD,
      map_div: '#gmap-route',
      type: 'polyline',
      draggable: true,
      controls_div: '#controls-polyline',
      controls_type: 'list',
      controls_on_map: false,
      view_all_text: 'Start'
    }).Load();
  $("#gmap-route").on("ViewOnMap", function(e, i) {
    console.log(i)
  });;
})
