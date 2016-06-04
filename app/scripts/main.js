// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
var tmpl = function () {
    var cache = {};

    return {
        render: function (str, data) {
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

$(function () {

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
        points: [{
            name: "Cuzco"
        }, {
            name: "Iquique",
            isActive: true
        }, {
            name: "Santiago de Chile"
        }]
    };
    var pointsSlider = document.getElementById("points-slider");
    if (pointsSlider) {
        pointsSlider.innerHTML = tmpl.render("pointsSliderTmpl", pointsModel);
        var pointsScroll = new IScroll('#points-slider', {});
    }

    /* point carousel */
    $('#point-carousel .carousel-indicators li').click(function () {
        $('#point-carousel .carousel-indicators li').removeClass('selected');
        $(this).addClass('selected');
    });

    $('#point-carousel').on('slide.bs.carousel', function (e) {
        $('#point-carousel .carousel-indicators li').removeClass('selected');
        var activeSlideIndex = $(e.relatedTarget).index();
        $($('#point-carousel .carousel-indicators li').eq(activeSlideIndex)).addClass('selected');
    })

});

$(document).ready(function () {

    var LocsD = [{
        lat: 45.4654,
        lon: 9.1866,
        title: 'Milan, Italy',
        html: '<h3>Milan, Italy</h3>'
    }, {
        lat: 47.36854,
        lon: 8.53910,
        title: 'Zurich, Switzerland',
        html: '<h3>Zurich, Switzerland</h3>',
        visible: false
    }, {
        lat: 48.892,
        lon: 2.359,
        title: 'Paris, France',
        html: '<h3>Paris, France</h3>',
        stopover: true
    }, {
        lat: 48.13654,
        lon: 11.57706,
        title: 'Munich, Germany',
        html: '<h3>Munich, Germany</h3>'
    }],
    directions = new Maplace({
        locations: LocsD,
        map_div: '#gmap-route',
        generate_controls: false,
        show_markers: false,
        type: 'directions',
        draggable: true,
        afterRoute: function (distance) {
            $('#km').text(': ' + (distance / 1000) + 'km');
        }
    }).Load();
})
