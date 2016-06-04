/**
 * Multi-level Photo Map
 * http://www.codrops.com/
 *
 * Copyright 2011, Pedro Botelho
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Tue Sep 27 2011
 */
$(function() {

  Map = function() {
    // google.maps.Map
    this.map = null;
    // the DOM element
    this.$mapEl = $('#map');
    this.$mapEl.data({
      originalWidth: this.$mapEl.width(),
      originalHeight: this.$mapEl.height()
    });
    // the map options
    this.mapOptions = {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_LEFT
      },
      panControl: true,
      panControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      }
    };
    // mode : fullscreen || normal
    this.mode = 'normal';

    this._create();
  };

  Map.prototype = {
    // initialize the google.maps.Map instance.
    _create: function() {

      var instance = this;
      this.map = new google.maps.Map(this.$mapEl[0], this.mapOptions);
      $(window).bind('resize.Map', function() {

        instance._resizeFullScreenMap(instance);

      });

    },
    getInstance: function() {

      return this.map;

    },
    // restricts maximum zoom level for fitbounds function :
    // taken from : http://boogleoogle.blogspot.com/2010/04/maximum-zoom-level-when-using-fitbounds.html
    _controlZoom: function() {

      var instance = this;

      zoomChangeListener = google.maps.event.addListener(this.map, 'zoom_changed', function() {
        zoomChangeBoundsListener = google.maps.event.addListener(instance.map, 'bounds_changed', function(event) {
          if (this.getZoom() > 15) // don't allow a zoom factor > 15
            this.setZoom(15);

          google.maps.event.removeListener(zoomChangeBoundsListener);
        });
        // remove this event listener since we will want to be able to zoom in after the markers are displayed on the map.
        google.maps.event.removeListener(zoomChangeListener);
      });

    },
    render: function(markersinfo) {

      var markersinfo = markersinfo || this.markersinfo;

      this.markersinfo = markersinfo;

      this._controlZoom();

      var LatLngList = new Array();

      for (var i = 0, len = markersinfo.length; i < len; ++i) {

        var minfo = markersinfo[i];
        LatLngList.push(new google.maps.LatLng(minfo.lat, minfo.lng));

      }

      // create a new viewpoint bound
      var bounds = new google.maps.LatLngBounds();

      // go through each...
      for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; ++i) {

        // And increase the bounds to take this point
        bounds.extend(LatLngList[i]);

      }

      // fit these bounds to the map
      this.map.fitBounds(bounds);

    },
    changeMode: function(mode) {

      this.mode = mode;

      switch (this.mode) {

        case 'normal':
          $mpContainer.removeClass('mp-container-fullscreen').css({
            width: $mpContainer.data('originalWidth'),
            height: $mpContainer.data('originalHeight')
          });
          this.$mapEl.css({
            width: this.$mapEl.data('originalWidth'),
            height: this.$mapEl.data('originalHeight')
          });
          this._triggerResize();
          this.render();

          break;
        case 'fullscreen':
          this._resizeFullScreenMap();

          break;

      };

    },
    isFullscreen: function() {

      return (this.mode === 'fullscreen');

    },
    _resizeFullScreenMap: function(instance) {

      var instance = instance || this;
      if (!instance.isFullscreen()) return false;

      var cssStyle = {};
      cssStyle.width = $(window).width();
      cssStyle.height = $(window).height();
      $mpContainer.addClass('mp-container-fullscreen').css(cssStyle);
      instance.$mapEl.css({
        width: cssStyle.width,
        height: cssStyle.height - $.data(Main, 'menu').$titleLbl.height()
      });

      // force the map resize
      instance._triggerResize();

      instance.render();

    },
    _triggerResize: function() {

      // force the map resize
      google.maps.event.trigger(this.map, 'resize');

    }
  };

  Marker = function(data) {
    this._create(data);
  };

  Marker.prototype = {
    _create: function(data) {

      var map = $.data(Main, 'map');

      // latitude and longitude
      this.lat = data.lat;
      this.lng = data.lng;
      // title
      this.title = data.title;
      // custom icons for the map markers
      this.mapicon = 'images/camera.png';
      this.mapiconHover = 'images/camera_hover.png';

      this.MapMarker = new google.maps.Marker({
        position: new google.maps.LatLng(this.lat, this.lng),
        map: map.getInstance(),
        icon: this.mapicon,
        //place		: place,
        title: this.title
      });

      // don't show for now
      this.MapMarker.setMap(null);

    },
    show: function() {

      var map = $.data(Main, 'map');
      this.MapMarker.setMap(map.getInstance());

    },
    hide: function() {

      this.MapMarker.setMap(null);

    },
    set: function(options) {

      if (typeof options.icon != 'undefined')
        this.MapMarker.setIcon(options.icon);
      if (typeof options.zindex != 'undefined')
        this.MapMarker.setZIndex(options.zindex);

    }
  };

  Photo = function(data) {
    this._create(data);
  };

  Photo.prototype = {
    _create: function(data) {

      this.index = data.index;
      this.thumb = data.thumb;
      this.source = data.source;
      this.description = data.description;

      this.marker = new Marker({
        lat: data.lat,
        lng: data.lng,
        title: this.description
      });

      var instance = this;
      // click event for photo (its marker)
      google.maps.event.addListener(this.marker.MapMarker, 'click', function() {
        var gallery = $.data(Main, 'gallery'),
          map = $.data(Main, 'map');

        gallery.currentPhoto = instance;

        if (map.isFullscreen()) {

          gallery.zoom();

        } else {

          map.place.clearIcons();
          instance.marker.set({
            icon: instance.marker.mapiconHover,
            zindex: 999
          });
          gallery.$elements.eq(instance.index).click();

        }

      });
      google.maps.event.addListener(this.marker.MapMarker, 'mouseover', function() {

        if (!$.data(Main, 'map').isFullscreen()) {

          var gallery = $.data(Main, 'gallery'),
            $galleryElements = gallery.$elements;

          if ($galleryElements) {

            var $galleryItem = $galleryElements.eq(instance.index);

            if ($galleryItem.position()) {

              var posTop = parseInt($galleryItem.position().top);

              gallery.$elements.removeClass('current');
              $galleryItem.addClass('current');

              instance.marker.set({
                icon: instance.marker.mapiconHover,
                zindex: 999
              });

              // scroll the gallery to the right photo
              var api = gallery.$galleryEl.data('jsp');

              if (api && api.getContentPositionY() !== posTop)
                api.scrollTo(0, posTop);

            }

          }

        }

      });
      google.maps.event.addListener(this.marker.MapMarker, 'mouseout', function() {

        if (!$.data(Main, 'map').isFullscreen()) {

          var gallery = $.data(Main, 'gallery'),
            $galleryElements = gallery.$elements;

          if ($galleryElements) {

            gallery.$elements.eq(instance.index).removeClass('current');

            if (!gallery.currentPhoto || instance.index !== gallery.currentPhoto.index)
              instance.marker.set({
                icon: instance.marker.mapicon,
                zindex: 1
              });

          }

        }

      });

    }
  };

  Place = function(data) {
    this._create(data);
  };

  Place.prototype = {
    _create: function(data) {

      this.name = data.name; // will be used for the Map Marker title (mouseover on the map)

      this.marker = new Marker({
        lat: data.lat,
        lng: data.lng,
        title: this.name
      });

      var instance = this;
      // click event for place (its marker)
      google.maps.event.addListener(this.marker.MapMarker, 'click', function() {

        var menu = $.data(Main, 'menu');
        menu.setTitle(instance.name);
        menu.lastTitle = menu.getTitle();
        // hide Place's marker
        instance.marker.hide();
        instance._showPhotos();
        instance._showGallery();

      });

      this.photos = new Array();

      for (var i = 0, len = data.photos.length; i < len; ++i) {

        this.photos.push(new Photo(data.photos[i]));

      }

    },
    _showPhotos: function() {

      var map = $.data(Main, 'map'),
        markersinfo = [];

      for (var i = 0, len = this.photos.length; i < len; ++i) {

        var photo = this.photos[i],
          marker = photo.marker;

        markersinfo.push({
          lat: marker.lat,
          lng: marker.lng
        });

        // if map in fullscreen photo markers should be the thumbs
        if (map.isFullscreen()) {
          marker.set({
            icon: new google.maps.MarkerImage(photo.thumb, new google.maps.Size(40, 40))
          });
        } else {
          marker.set({
            icon: marker.mapicon
          });
        }

        marker.show();

      }

      // Map keeps track of current place
      map.place = this;
      map.render(markersinfo);

      var menu = $.data(Main, 'menu');
      menu.$backBtn.show();

    },
    hidePhotos: function() {

      var map = $.data(Main, 'map'),
        gallery = $.data(Main, 'gallery');

      for (var i = 0, len = this.photos.length; i < len; ++i) {

        var photo = this.photos[i],
          marker = photo.marker;

        marker.hide();

      }

      gallery.hide();

    },
    _showGallery: function() {

      $.data(Main, 'gallery').show(this.photos);

    },
    clearIcons: function() {

      for (var i = 0, len = this.photos.length; i < len; ++i) {

        var photo = this.photos[i],
          marker = photo.marker;

        marker.set({
          icon: marker.mapicon,
          zindex: 1
        });

      }

    }
  };

  MapPhotoAlbum = function() {
    // array of places
    this.places = new Array();
  };

  MapPhotoAlbum.prototype = {
    init: function() {

      var instance = this;

      // make an AJAX call to get the places from the XML file, and display them on the Map
      this._getPlaces(function() {
        instance._showPlaces();
      });

      var menu = $.data(Main, 'menu');

      // initialize events for the menu controls
      menu.$backBtn.bind('click.MapPhotoAlbum', function(event) {

        // hide galleryAlbum container if present
        var gallery = $.data(Main, 'gallery');
        if (gallery.$galleryAlbum)
          gallery.$galleryAlbum.hide();

        // hide current place's markers
        var map = $.data(Main, 'map'),
          place = map.place;

        place.hidePhotos();
        map.place = null;

        // show places again
        instance._showPlaces();

        // hide back button
        $(this).hide();

        return false;

      });

      menu.$modeBtn.toggle(
        function(event) {

          $(this).addClass('mp-option-normal');

          // close the gallery album overlay if opened
          var gallery = $.data(Main, 'gallery');
          if (gallery.$galleryClose)
            gallery.$galleryClose.click();

          var map = $.data(Main, 'map');
          map.changeMode('fullscreen');

          // photo markers become thumbs if fullscreen
          if (map.place) {
            for (var i = 0, len = map.place.photos.length; i < len; ++i) {

              var photo = map.place.photos[i],
                marker = photo.marker;
              marker.set({
                icon: new google.maps.MarkerImage(photo.thumb, new google.maps.Size(40, 40))
              });

            }
          }

          return false;

        },
        function(event) {

          $(this).removeClass('mp-option-normal');

          var map = $.data(Main, 'map');
          map.changeMode('normal');

          if (map.place) {
            for (var i = 0, len = map.place.photos.length; i < len; ++i) {

              var photo = map.place.photos[i],
                marker = photo.marker;

              marker.set({
                icon: marker.mapicon
              });

            }
          }
          return false;

        }
      );

    },
    _getPlaces: function(callback) {

      var instance = this;

      // get the places and its info from the XML file
      // $.getJSON('album.json', function( data ) {
      var data = {
        "name": "Thailand 2011",
        "description": "A wonderful trip",
        "places": [{
          "name": "Bangkok",
          "lat": 13.6966933367,
          "lng": 100.571594238,
          "photos": [{
            "index": 0,
            "thumb": "photos\/Bangkok\/thumbs\/1.jpg",
            "source": "photos\/Bangkok\/1.jpg",
            "description": "Some image description",
            "lat": 13.7100353425,
            "lng": 100.520439148
          }, {
            "index": 1,
            "thumb": "photos\/Bangkok\/thumbs\/2.jpg",
            "source": "photos\/Bangkok\/2.jpg",
            "description": "Some image description",
            "lat": 13.693357717,
            "lng": 100.53314209
          }, {
            "index": 2,
            "thumb": "photos\/Bangkok\/thumbs\/3.jpg",
            "source": "photos\/Bangkok\/3.jpg",
            "description": "Some image description",
            "lat": 13.6780132567,
            "lng": 100.591850281
          }, {
            "index": 3,
            "thumb": "photos\/Bangkok\/thumbs\/4.jpg",
            "source": "photos\/Bangkok\/4.jpg",
            "description": "Some image description",
            "lat": 13.6653366438,
            "lng": 100.611248016
          }, {
            "index": 4,
            "thumb": "photos\/Bangkok\/thumbs\/5.jpg",
            "source": "photos\/Bangkok\/5.jpg",
            "description": "Some image description",
            "lat": 13.871413,
            "lng": 100.382767
          }, {
            "index": 5,
            "thumb": "photos\/Bangkok\/thumbs\/6.jpg",
            "source": "photos\/Bangkok\/6.jpg",
            "description": "Some image description",
            "lat": 13.766063,
            "lng": 100.351181
          }, {
            "index": 6,
            "thumb": "photos\/Bangkok\/thumbs\/7.jpg",
            "source": "photos\/Bangkok\/7.jpg",
            "description": "Some image description",
            "lat": 13.753058,
            "lng": 100.472202
          }, {
            "index": 7,
            "thumb": "photos\/Bangkok\/thumbs\/8.jpg",
            "source": "photos\/Bangkok\/8.jpg",
            "description": "Some image description",
            "lat": 13.724711,
            "lng": 100.446625
          }, {
            "index": 8,
            "thumb": "photos\/Bangkok\/thumbs\/9.jpg",
            "source": "photos\/Bangkok\/9.jpg",
            "description": "Some image description",
            "lat": 13.698028,
            "lng": 100.50705
          }, {
            "index": 9,
            "thumb": "photos\/Bangkok\/thumbs\/10.jpg",
            "source": "photos\/Bangkok\/10.jpg",
            "description": "Some image description",
            "lat": 13.672676,
            "lng": 100.366287
          }, {
            "index": 10,
            "thumb": "photos\/Bangkok\/thumbs\/11.jpg",
            "source": "photos\/Bangkok\/11.jpg",
            "description": "Some image description",
            "lat": 13.647989,
            "lng": 100.437012
          }, {
            "index": 11,
            "thumb": "photos\/Bangkok\/thumbs\/12.jpg",
            "source": "photos\/Bangkok\/12.jpg",
            "description": "Some image description",
            "lat": 13.609285,
            "lng": 100.450745
          }, {
            "index": 12,
            "thumb": "photos\/Bangkok\/thumbs\/13.jpg",
            "source": "photos\/Bangkok\/13.jpg",
            "description": "Some image description",
            "lat": 13.5926,
            "lng": 100.491257
          }, {
            "index": 13,
            "thumb": "photos\/Bangkok\/thumbs\/14.jpg",
            "source": "photos\/Bangkok\/14.jpg",
            "description": "Some image description",
            "lat": 13.559894,
            "lng": 100.553741
          }, {
            "index": 14,
            "thumb": "photos\/Bangkok\/thumbs\/15.jpg",
            "source": "photos\/Bangkok\/15.jpg",
            "description": "Some image description",
            "lat": 13.584591,
            "lng": 100.627899
          }, {
            "index": 15,
            "thumb": "photos\/Bangkok\/thumbs\/16.jpg",
            "source": "photos\/Bangkok\/16.jpg",
            "description": "Some image description",
            "lat": 13.603946,
            "lng": 100.537262
          }, {
            "index": 16,
            "thumb": "photos\/Bangkok\/thumbs\/17.jpg",
            "source": "photos\/Bangkok\/17.jpg",
            "description": "Some image description",
            "lat": 13.619962,
            "lng": 100.508423
          }, {
            "index": 17,
            "thumb": "photos\/Bangkok\/thumbs\/18.jpg",
            "source": "photos\/Bangkok\/18.jpg",
            "description": "Some image description",
            "lat": 13.656663,
            "lng": 100.485764
          }, {
            "index": 18,
            "thumb": "photos\/Bangkok\/thumbs\/19.jpg",
            "source": "photos\/Bangkok\/19.jpg",
            "description": "Some image description",
            "lat": 13.666004,
            "lng": 100.516663
          }, {
            "index": 19,
            "thumb": "photos\/Bangkok\/thumbs\/20.jpg",
            "source": "photos\/Bangkok\/20.jpg",
            "description": "Some image description",
            "lat": 13.680682,
            "lng": 100.538635
          }, {
            "index": 20,
            "thumb": "photos\/Bangkok\/thumbs\/21.jpg",
            "source": "photos\/Bangkok\/21.jpg",
            "description": "Some image description",
            "lat": 13.696693,
            "lng": 100.473404
          }, {
            "index": 21,
            "thumb": "photos\/Bangkok\/thumbs\/22.jpg",
            "source": "photos\/Bangkok\/22.jpg",
            "description": "Some image description",
            "lat": 13.695359,
            "lng": 100.50293
          }, {
            "index": 22,
            "thumb": "photos\/Bangkok\/thumbs\/23.jpg",
            "source": "photos\/Bangkok\/23.jpg",
            "description": "Some image description",
            "lat": 13.699362,
            "lng": 100.525589
          }, {
            "index": 23,
            "thumb": "photos\/Bangkok\/thumbs\/24.jpg",
            "source": "photos\/Bangkok\/24.jpg",
            "description": "Some image description",
            "lat": 13.620629,
            "lng": 100.602493
          }, {
            "index": 24,
            "thumb": "photos\/Bangkok\/thumbs\/25.jpg",
            "source": "photos\/Bangkok\/25.jpg",
            "description": "Some image description",
            "lat": 13.616625,
            "lng": 100.653305
          }, {
            "index": 25,
            "thumb": "photos\/Bangkok\/thumbs\/26.jpg",
            "source": "photos\/Bangkok\/26.jpg",
            "description": "Some image description",
            "lat": 13.877413,
            "lng": 100.60318
          }, {
            "index": 26,
            "thumb": "photos\/Bangkok\/thumbs\/27.jpg",
            "source": "photos\/Bangkok\/27.jpg",
            "description": "Some image description",
            "lat": 13.856081,
            "lng": 100.643692
          }, {
            "index": 27,
            "thumb": "photos\/Bangkok\/thumbs\/28.jpg",
            "source": "photos\/Bangkok\/28.jpg",
            "description": "Some image description",
            "lat": 13.817411,
            "lng": 100.680084
          }, {
            "index": 28,
            "thumb": "photos\/Bangkok\/thumbs\/29.jpg",
            "source": "photos\/Bangkok\/29.jpg",
            "description": "Some image description",
            "lat": 13.816077,
            "lng": 100.730896
          }, {
            "index": 29,
            "thumb": "photos\/Bangkok\/thumbs\/30.jpg",
            "source": "photos\/Bangkok\/30.jpg",
            "description": "Some image description",
            "lat": 13.76673,
            "lng": 100.692444
          }, {
            "index": 30,
            "thumb": "photos\/Bangkok\/thumbs\/31.jpg",
            "source": "photos\/Bangkok\/31.jpg",
            "description": "Some image description",
            "lat": 13.789405,
            "lng": 100.618286
          }, {
            "index": 31,
            "thumb": "photos\/Bangkok\/thumbs\/32.jpg",
            "source": "photos\/Bangkok\/32.jpg",
            "description": "Some image description",
            "lat": 13.791405,
            "lng": 100.587387
          }, {
            "index": 32,
            "thumb": "photos\/Bangkok\/thumbs\/33.jpg",
            "source": "photos\/Bangkok\/33.jpg",
            "description": "Some image description",
            "lat": 13.778068,
            "lng": 100.537262
          }, {
            "index": 33,
            "thumb": "photos\/Bangkok\/thumbs\/34.jpg",
            "source": "photos\/Bangkok\/34.jpg",
            "description": "Some image description",
            "lat": 13.7754,
            "lng": 100.565414
          }, {
            "index": 34,
            "thumb": "photos\/Bangkok\/thumbs\/35.jpg",
            "source": "photos\/Bangkok\/35.jpg",
            "description": "Some image description",
            "lat": 13.751391,
            "lng": 100.584641
          }, {
            "index": 35,
            "thumb": "photos\/Bangkok\/thumbs\/36.jpg",
            "source": "photos\/Bangkok\/36.jpg",
            "description": "Some image description",
            "lat": 13.723377,
            "lng": 100.485764
          }, {
            "index": 36,
            "thumb": "photos\/Bangkok\/thumbs\/37.jpg",
            "source": "photos\/Bangkok\/37.jpg",
            "description": "Some image description",
            "lat": 13.731381,
            "lng": 100.520096
          }, {
            "index": 37,
            "thumb": "photos\/Bangkok\/thumbs\/38.jpg",
            "source": "photos\/Bangkok\/38.jpg",
            "description": "Some image description",
            "lat": 13.730714,
            "lng": 100.548248
          }, {
            "index": 38,
            "thumb": "photos\/Bangkok\/thumbs\/39.jpg",
            "source": "photos\/Bangkok\/39.jpg",
            "description": "Some image description",
            "lat": 13.716706,
            "lng": 100.561295
          }, {
            "index": 39,
            "thumb": "photos\/Bangkok\/thumbs\/40.jpg",
            "source": "photos\/Bangkok\/40.jpg",
            "description": "Some image description",
            "lat": 13.71804,
            "lng": 100.585327
          }, {
            "index": 40,
            "thumb": "photos\/Bangkok\/thumbs\/41.jpg",
            "source": "photos\/Bangkok\/41.jpg",
            "description": "Some image description",
            "lat": 13.716706,
            "lng": 100.652618
          }, {
            "index": 41,
            "thumb": "photos\/Bangkok\/thumbs\/42.jpg",
            "source": "photos\/Bangkok\/42.jpg",
            "description": "Some image description",
            "lat": 13.694025,
            "lng": 100.689011
          }, {
            "index": 42,
            "thumb": "photos\/Bangkok\/thumbs\/43.jpg",
            "source": "photos\/Bangkok\/43.jpg",
            "description": "Some image description",
            "lat": 13.655996,
            "lng": 100.670471
          }, {
            "index": 43,
            "thumb": "photos\/Bangkok\/thumbs\/44.jpg",
            "source": "photos\/Bangkok\/44.jpg",
            "description": "Some image description",
            "lat": 13.64265,
            "lng": 100.581894
          }]
        }, {
          "name": "Phuket",
          "lat": 7.96539756377,
          "lng": 98.3399963379,
          "photos": [{
            "index": 0,
            "thumb": "photos\/Phuket\/thumbs\/1.jpg",
            "source": "photos\/Phuket\/1.jpg",
            "description": "Some image description3",
            "lat": 7.893989182,
            "lng": 98.3001708984
          }, {
            "index": 1,
            "thumb": "photos\/Phuket\/thumbs\/2.jpg",
            "source": "photos\/Phuket\/2.jpg",
            "description": "Some image description",
            "lat": 8.077586,
            "lng": 98.274765
          }, {
            "index": 2,
            "thumb": "photos\/Phuket\/thumbs\/3.jpg",
            "source": "photos\/Phuket\/3.jpg",
            "description": "Some image description",
            "lat": 8.043592,
            "lng": 98.276138
          }, {
            "index": 3,
            "thumb": "photos\/Phuket\/thumbs\/4.jpg",
            "source": "photos\/Phuket\/4.jpg",
            "description": "Some image description",
            "lat": 8.029994,
            "lng": 98.290558
          }, {
            "index": 4,
            "thumb": "photos\/Phuket\/thumbs\/5.jpg",
            "source": "photos\/Phuket\/5.jpg",
            "description": "Some image description",
            "lat": 8.05651,
            "lng": 98.42514
          }, {
            "index": 5,
            "thumb": "photos\/Phuket\/thumbs\/6.jpg",
            "source": "photos\/Phuket\/6.jpg",
            "description": "Some image description",
            "lat": 8.039513,
            "lng": 98.410721
          }, {
            "index": 6,
            "thumb": "photos\/Phuket\/thumbs\/7.jpg",
            "source": "photos\/Phuket\/7.jpg",
            "description": "Some image description",
            "lat": 8.019796,
            "lng": 98.359909
          }, {
            "index": 7,
            "thumb": "photos\/Phuket\/thumbs\/8.jpg",
            "source": "photos\/Phuket\/8.jpg",
            "description": "Some image description",
            "lat": 7.991238,
            "lng": 98.331757
          }, {
            "index": 8,
            "thumb": "photos\/Phuket\/thumbs\/9.jpg",
            "source": "photos\/Phuket\/9.jpg",
            "description": "Some image description",
            "lat": 7.993957,
            "lng": 98.394241
          }, {
            "index": 9,
            "thumb": "photos\/Phuket\/thumbs\/10.jpg",
            "source": "photos\/Phuket\/10.jpg",
            "description": "Some image description",
            "lat": 7.957577,
            "lng": 98.447113
          }, {
            "index": 10,
            "thumb": "photos\/Phuket\/thumbs\/11.jpg",
            "source": "photos\/Phuket\/11.jpg",
            "description": "Some image description",
            "lat": 7.947037,
            "lng": 98.335876
          }, {
            "index": 11,
            "thumb": "photos\/Phuket\/thumbs\/12.jpg",
            "source": "photos\/Phuket\/12.jpg",
            "description": "Some image description",
            "lat": 7.932075,
            "lng": 98.265152
          }, {
            "index": 12,
            "thumb": "photos\/Phuket\/thumbs\/13.jpg",
            "source": "photos\/Phuket\/13.jpg",
            "description": "Some image description",
            "lat": 7.938876,
            "lng": 98.313904
          }, {
            "index": 13,
            "thumb": "photos\/Phuket\/thumbs\/14.jpg",
            "source": "photos\/Phuket\/14.jpg",
            "description": "Some image description",
            "lat": 7.924594,
            "lng": 98.312531
          }, {
            "index": 14,
            "thumb": "photos\/Phuket\/thumbs\/15.jpg",
            "source": "photos\/Phuket\/15.jpg",
            "description": "Some image description",
            "lat": 7.930715,
            "lng": 98.336563
          }, {
            "index": 15,
            "thumb": "photos\/Phuket\/thumbs\/16.jpg",
            "source": "photos\/Phuket\/16.jpg",
            "description": "Some image description",
            "lat": 7.926635,
            "lng": 98.359909
          }, {
            "index": 16,
            "thumb": "photos\/Phuket\/thumbs\/17.jpg",
            "source": "photos\/Phuket\/17.jpg",
            "description": "Some image description",
            "lat": 7.940066,
            "lng": 98.422909
          }, {
            "index": 17,
            "thumb": "photos\/Phuket\/thumbs\/18.jpg",
            "source": "photos\/Phuket\/18.jpg",
            "description": "Some image description",
            "lat": 7.908442,
            "lng": 98.549938
          }, {
            "index": 18,
            "thumb": "photos\/Phuket\/thumbs\/19.jpg",
            "source": "photos\/Phuket\/19.jpg",
            "description": "Some image description",
            "lat": 7.891439,
            "lng": 98.514919
          }, {
            "index": 19,
            "thumb": "photos\/Phuket\/thumbs\/20.jpg",
            "source": "photos\/Phuket\/20.jpg",
            "description": "Some image description",
            "lat": 7.880896,
            "lng": 98.412781
          }, {
            "index": 20,
            "thumb": "photos\/Phuket\/thumbs\/21.jpg",
            "source": "photos\/Phuket\/21.jpg",
            "description": "Some image description",
            "lat": 7.881747,
            "lng": 98.397675
          }, {
            "index": 21,
            "thumb": "photos\/Phuket\/thumbs\/22.jpg",
            "source": "photos\/Phuket\/22.jpg",
            "description": "Some image description",
            "lat": 7.872224,
            "lng": 98.391495
          }, {
            "index": 22,
            "thumb": "photos\/Phuket\/thumbs\/23.jpg",
            "source": "photos\/Phuket\/23.jpg",
            "description": "Some image description",
            "lat": 7.885827,
            "lng": 98.344116
          }, {
            "index": 23,
            "thumb": "photos\/Phuket\/thumbs\/24.jpg",
            "source": "photos\/Phuket\/24.jpg",
            "description": "Some image description",
            "lat": 7.885147,
            "lng": 98.300858
          }, {
            "index": 24,
            "thumb": "photos\/Phuket\/thumbs\/25.jpg",
            "source": "photos\/Phuket\/25.jpg",
            "description": "Some image description",
            "lat": 7.866783,
            "lng": 98.324203
          }, {
            "index": 25,
            "thumb": "photos\/Phuket\/thumbs\/26.jpg",
            "source": "photos\/Phuket\/26.jpg",
            "description": "Some image description",
            "lat": 7.840255,
            "lng": 98.296051
          }, {
            "index": 26,
            "thumb": "photos\/Phuket\/thumbs\/27.jpg",
            "source": "photos\/Phuket\/27.jpg",
            "description": "Some image description",
            "lat": 7.82733,
            "lng": 98.33931
          }, {
            "index": 27,
            "thumb": "photos\/Phuket\/thumbs\/28.jpg",
            "source": "photos\/Phuket\/28.jpg",
            "description": "Some image description",
            "lat": 7.817807,
            "lng": 98.385315
          }, {
            "index": 28,
            "thumb": "photos\/Phuket\/thumbs\/29.jpg",
            "source": "photos\/Phuket\/29.jpg",
            "description": "Some image description",
            "lat": 7.787874,
            "lng": 98.374329
          }, {
            "index": 29,
            "thumb": "photos\/Phuket\/thumbs\/30.jpg",
            "source": "photos\/Phuket\/30.jpg",
            "description": "Some image description",
            "lat": 7.789235,
            "lng": 98.361969
          }, {
            "index": 30,
            "thumb": "photos\/Phuket\/thumbs\/31.jpg",
            "source": "photos\/Phuket\/31.jpg",
            "description": "Some image description",
            "lat": 7.774948,
            "lng": 98.31459
          }]
        }, {
          "name": "Myeik",
          "lat": 12.43844,
          "lng": 98.60878,
          "photos": [{
            "index": 0,
            "thumb": "photos\/Myeik\/thumbs\/1.jpg",
            "source": "photos\/Myeik\/1.jpg",
            "description": "Some image description3",
            "lat": 12.461385,
            "lng": 98.575516
          }, {
            "index": 1,
            "thumb": "photos\/Myeik\/thumbs\/2.jpg",
            "source": "photos\/Myeik\/2.jpg",
            "description": "Some image description",
            "lat": 12.436074,
            "lng": 98.586674
          }, {
            "index": 2,
            "thumb": "photos\/Myeik\/thumbs\/3.jpg",
            "source": "photos\/Myeik\/3.jpg",
            "description": "Some image description",
            "lat": 12.417801,
            "lng": 98.609505
          }, {
            "index": 3,
            "thumb": "photos\/Myeik\/thumbs\/4.jpg",
            "source": "photos\/Myeik\/4.jpg",
            "description": "Some image description",
            "lat": 12.427021,
            "lng": 98.605556
          }, {
            "index": 4,
            "thumb": "photos\/Myeik\/thumbs\/5.jpg",
            "source": "photos\/Myeik\/5.jpg",
            "description": "Some image description",
            "lat": 12.426854,
            "lng": 98.611736
          }, {
            "index": 5,
            "thumb": "photos\/Myeik\/thumbs\/6.jpg",
            "source": "photos\/Myeik\/6.jpg",
            "description": "Some image description",
            "lat": 12.431883,
            "lng": 98.60281
          }, {
            "index": 6,
            "thumb": "photos\/Myeik\/thumbs\/7.jpg",
            "source": "photos\/Myeik\/7.jpg",
            "description": "Some image description",
            "lat": 12.430206,
            "lng": 98.648472
          }, {
            "index": 7,
            "thumb": "photos\/Myeik\/thumbs\/8.jpg",
            "source": "photos\/Myeik\/8.jpg",
            "description": "Some image description",
            "lat": 12.452166,
            "lng": 98.623238
          }, {
            "index": 8,
            "thumb": "photos\/Myeik\/thumbs\/9.jpg",
            "source": "photos\/Myeik\/9.jpg",
            "description": "Some image description",
            "lat": 12.466246,
            "lng": 98.605556
          }, {
            "index": 9,
            "thumb": "photos\/Myeik\/thumbs\/10.jpg",
            "source": "photos\/Myeik\/10.jpg",
            "description": "Some image description",
            "lat": 12.466916,
            "lng": 98.61517
          }, {
            "index": 10,
            "thumb": "photos\/Myeik\/thumbs\/11.jpg",
            "source": "photos\/Myeik\/11.jpg",
            "description": "Some image description",
            "lat": 12.470436,
            "lng": 98.620663
          }, {
            "index": 11,
            "thumb": "photos\/Myeik\/thumbs\/12.jpg",
            "source": "photos\/Myeik\/12.jpg",
            "description": "Some image description",
            "lat": 12.469431,
            "lng": 98.635597
          }, {
            "index": 12,
            "thumb": "photos\/Myeik\/thumbs\/13.jpg",
            "source": "photos\/Myeik\/13.jpg",
            "description": "Some image description",
            "lat": 12.463396,
            "lng": 98.645554
          }, {
            "index": 13,
            "thumb": "photos\/Myeik\/thumbs\/14.jpg",
            "source": "photos\/Myeik\/14.jpg",
            "description": "Some image description",
            "lat": 12.399862,
            "lng": 98.623924
          }]
        }]
      };
      // the album name
      instance.album = data.name;
      // the album description
      instance.description = data.description;

      $.each(data.places, function(key, placeinfo) {
        var place = new Place(placeinfo)
        instance.places.push(place);
      });

      if (callback) callback.call();

      // });

    },
    _showPlaces: function() {

      var map = $.data(Main, 'map'),
        markersinfo = [];

      for (var i = 0, len = this.places.length; i < len; ++i) {

        var place = this.places[i],
          marker = place.marker;

        markersinfo.push({
          lat: marker.lat,
          lng: marker.lng
        });

        marker.show();

      }

      map.render(markersinfo);

      var menu = $.data(Main, 'menu');
      menu.setTitle(this.album + ' : ' + this.description);
      menu.lastTitle = menu.getTitle();
    }
  };

  Menu = function() {
    // add Title and Control buttons
    this._addTitleControls();
  };

  Menu.prototype = {
    // adds title and buttons to the DOM
    _addTitleControls: function() {

      this.$backBtn = $('<a href="#" class="mp-option-back">Back</a>').hide();
      this.$modeBtn = $('<a href="#" class="mp-option-fullscreen">Fullscreen</a>');

      var $options = $('<div class="mp-options"/>').append(this.$backBtn).append(this.$modeBtn);

      this.$titleLbl = $('<h2 class="mp-label"></h2>');

      $mpContainer.append(
        $('<div class="mp-options-wrapper"/>').append($options).append(this.$titleLbl)
      );

    },
    // sets the current title
    setTitle: function(title) {

      this.titleLbl = title;
      this.$titleLbl.text(title);

    },
    getTitle: function() {

      return this.titleLbl;

    }
  };

  Gallery = function() {
    this.$galleryEl = $('#mp-album-wrapper');
    this._initEvents();
  };

  Gallery.prototype = {
    show: function(photos) {

      var instance = this;

      this.photos = photos;

      var tmplPhotosData = new Array(),
        loaded = 0;

      for (var i = 0, len = this.photos.length; i < len; ++i) {

        tmplPhotosData.push(this.photos[i].thumb);

        $('<img/>').load(function() {

          ++loaded

          if (loaded === len) {

            $('#galleryTmpl').tmpl({
                tmplPhotosData: tmplPhotosData
              })
              .appendTo(instance.$galleryEl);

            instance.$galleryEl.jScrollPane({
              verticalDragMinHeight: 40,
              verticalDragMaxHeight: 40,
              animateScroll: true
            });

            instance.$elements = instance.$galleryEl.find('div.mp-album > a');

            instance.$elements.bind('mouseenter.Gallery', function(event) {

              var $el = $(this),
                photo = instance.photos[$el.index()];

              $el.addClass('current').siblings('a').removeClass('current');

              $.data(Main, 'map').place.clearIcons();
              photo.marker.set({
                icon: photo.marker.mapiconHover,
                zindex: 999
              });

            }).bind('mouseleave.Gallery', function(event) {

              var $el = $(this),
                photo = instance.photos[$el.index()];

              if (!instance.currentPhoto || photo.index !== instance.currentPhoto.index)
                $.data(Main, 'map').place.clearIcons();

              $el.removeClass('current');

            }).bind('click.Gallery', function(event) {

              var $el = $(this),
                photo = instance.photos[$el.index()];

              $el.removeClass('current');

              instance.current = $el.index();
              instance.currentPhoto = instance.photos[instance.current];

              instance._startSlider();

              return false;

            });

          }

        }).attr('src', this.photos[i].thumb);

      }

    },
    hide: function() {

      this.$galleryEl.empty();
      this.$galleryEl.removeData('jsp');

    },
    _startSlider: function() {

      if (!this.$galleryAlbum) {

        var data = {
          source: this.currentPhoto.source
        };

        $('#galleryAlbumTmpl').tmpl({
            tmplPhotoData: data
          })
          .appendTo($mpContainer);

        this.$galleryAlbum = $('#mp-album-overlay');
        this.$galleryNext = this.$galleryAlbum.find('span.mp-album-nav-next').hide();
        this.$galleryPrev = this.$galleryAlbum.find('span.mp-album-nav-prev').hide();
        this.$galleryClose = this.$galleryAlbum.find('span.mp-album-overlay-close').hide();
        this.$galleryZoom = this.$galleryAlbum.find('a.mp-album-image-zoom');
        this.$currentImage = this.$galleryAlbum.find('div.mp-album-image > img').hide();
        this.$loading = this.$galleryAlbum.find('div.mp-image-loading-small').show();

        var instance = this;

        $('<img/>').load(function() {

          instance.$loading.hide();
          instance.$currentImage.show();
          instance.$galleryNext.show();
          instance.$galleryPrev.show();
          instance.$galleryClose.show();

          instance._initSliderEvents();

        }).attr('src', this.currentPhoto.source);

      } else {

        var instance = this;

        this.$currentImage.hide();
        this.$galleryAlbum.show();

        this.$loading.show();

        $('<img/>').load(function() {

          instance.$loading.hide();
          instance.$currentImage.attr('src', instance.currentPhoto.source);
          instance.$currentImage.show();

        }).attr('src', this.currentPhoto.source);

      }

      $.data(Main, 'menu').setTitle(this.currentPhoto.description);

    },
    _initSliderEvents: function() {

      var instance = this;

      this.$galleryClose.bind('click.Gallery', function() {

        instance.$galleryAlbum.hide();

        instance.current = null;
        instance.currentPhoto = null;

        var menu = $.data(Main, 'menu');
        menu.setTitle(menu.lastTitle);

        var map = $.data(Main, 'map');
        if (map.place)
          map.place.clearIcons();

      });

      this.$galleryNext.bind('click.Gallery', function() {

        instance._navigateSlider(instance, 'right');

      });

      this.$galleryPrev.bind('click.Gallery', function() {

        instance._navigateSlider(instance, 'left');

      });

      this.$galleryZoom.bind('click.Gallery', function() {

        instance.zoom();

        return false;

      });

    },
    _navigateSlider: function(instance, dir) {

      if (dir === 'right') {
        if (instance.current + 1 < instance.photos.length)
          ++instance.current;
        else
          instance.current = 0;
      } else if (dir === 'left') {
        if (instance.current - 1 >= 0)
          --instance.current;
        else
          instance.current = instance.photos.length - 1;
      }


      instance.currentPhoto = instance.photos[instance.current];

      instance.$loading.show();

      $('<img/>').load(function() {

        instance.$loading.hide();
        instance.$currentImage.attr('src', instance.currentPhoto.source);
        $.data(Main, 'menu').setTitle(instance.currentPhoto.description);

        $.data(Main, 'map').place.clearIcons();
        instance.currentPhoto.marker.set({
          icon: instance.currentPhoto.marker.mapiconHover,
          zindex: 999
        });

      }).attr('src', this.currentPhoto.source);

    },
    zoom: function() {

      var instance = this;

      if (!this.$galleryFullscreen) {

        var data = {
          source: this.currentPhoto.source,
          description: this.currentPhoto.description
        };

        $('#galleryFullscreenTmpl').tmpl({
            tmplPhotoData: data
          })
          .appendTo($mpContainer);

        this.$galleryFullscreen = $('#mp-image-overlay');
        this.$galleryFullscreenClose = this.$galleryFullscreen.find('span.mp-image-overlay-close');
        this.$galleryFullscreenDescription = this.$galleryFullscreen.find('h2.mp-label');
        this.$galleryFullscreenImage = this.$galleryFullscreen.children('img');

        this._initGalleryFullscreenEvents();

        $('<img/>').load(function() {

          instance._resizeImage(instance.$galleryFullscreenImage);
          instance.$galleryFullscreenImage.show();

        }).attr('src', this.currentPhoto.source);

      } else {

        this.$galleryFullscreenImage.hide();
        this.$galleryFullscreen.show();

        $('<img/>').load(function() {

          instance.$galleryFullscreenDescription.text(instance.currentPhoto.description);
          instance.$galleryFullscreenImage.attr('src', instance.currentPhoto.source);
          instance._resizeImage(instance.$galleryFullscreenImage);
          instance.$galleryFullscreenImage.show();

        }).attr('src', this.currentPhoto.source);

      }

    },
    _initGalleryFullscreenEvents: function() {

      var instance = this;

      this.$galleryFullscreenClose.bind('click.Gallery', function() {

        instance.$galleryFullscreen.hide();

      });

    },
    _resizeImage: function($image) {

      var widthMargin = 0,
        heightMargin = 2 * this.$galleryFullscreenDescription.height(),

        windowH = $(window).height() - heightMargin,
        windowW = $(window).width() - widthMargin,
        theImage = new Image();

      theImage.src = $image.attr("src");

      var imgwidth = theImage.width,
        imgheight = theImage.height;

      if ((imgwidth > windowW) || (imgheight > windowH)) {
        if (imgwidth > imgheight) {
          var newwidth = windowW,
            ratio = imgwidth / windowW,
            newheight = imgheight / ratio;

          theImage.height = newheight;
          theImage.width = newwidth;

          if (newheight > windowH) {
            var newnewheight = windowH,
              newratio = newheight / windowH,
              newnewwidth = newwidth / newratio;

            theImage.width = newnewwidth;
            theImage.height = newnewheight;
          }
        } else {
          var newheight = windowH,
            ratio = imgheight / windowH,
            newwidth = imgwidth / ratio;

          theImage.height = newheight;
          theImage.width = newwidth;

          if (newwidth > windowW) {
            var newnewwidth = windowW,
              newratio = newwidth / windowW,
              newnewheight = newheight / newratio;

            theImage.height = newnewheight;
            theImage.width = newnewwidth;
          }
        }
      }

      $image.css({
        'width': theImage.width + 'px',
        'height': theImage.height + 'px',
        'margin-left': -theImage.width / 2 + 'px',
        'margin-top': -theImage.height / 2 + this.$galleryFullscreenDescription.height() / 2 + 'px'
      });

    },
    _initEvents: function() {

      var instance = this;

      $(window).bind('resize.Gallery', function() {

        if (instance.$galleryFullscreenImage)
          instance._resizeImage(instance.$galleryFullscreenImage);

      });

    }
  };

  var $mpContainer = $('#mp-container'),
    Main = (function() {

      var init = function() {

        // instance of Map
        $.data(Main, 'map', new Map());
        // instance of Menu
        $.data(Main, 'menu', new Menu());
        // instance of Gallery
        $.data(Main, 'gallery', new Gallery());

        var mapPhotoAlbum = new MapPhotoAlbum();
        mapPhotoAlbum.init();

      };

      return {
        init: init
      };

    })();

  $mpContainer.data({
    originalWidth: $mpContainer.width(),
    originalHeight: $mpContainer.height()
  });

  Main.init();

});
