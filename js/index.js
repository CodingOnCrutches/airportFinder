//CAO 14Oct2018 2155

var map
var markers = []

// set filter options to true since the checkboxes default checked
var filters = {HARD:true, TURF:true, DIRT:true, WATER:true, PRIVATEUSE:true, PUBLICUSE:true}
// set size filter defualts, and then use the input boxes to change this variable
var sizefilters = {minlength:0, maxlength:100000, minwidth:0, maxwidth:100000}
//user fields list
var userfieldslist = []

$(function () {
  $('input[name=filter]').change(function (e) {
    map_filter(this.id);
    filter_markers()
  });
  $('input[name=sizefilter]').change(function (e) {
    map_sizefilter(this.id);
    filter_markers()
  });
  $('input[name=userfieldsinputname]').change(function (e) {
    map_userfieldsPrepper(this.id);
    filter_markers()
  });
  $('#resetSearchCriteria').on('click', function() {
    document.getElementById("myform").reset()
  });
  $('#loadMyAirfields').on('click', function() {
    loadMyFile()
    filter_markers()
  });
})

var filter_markers = function() { 
  for (i = 0; i < markers.length; i++) {
    marker = markers[i];
    keep=false;
    marker.setIcon("resources/red-dot.png") //here to reset markers if the user clears out their fields

    //Check if private/public use is ok first, only if so then check runways (so we don't check runways on a field that we can't use):
    if ((filters['PRIVATEUSE'] && marker.properties['runwayUse'] == "Private") || (filters['PUBLICUSE'] && marker.properties['runwayUse'] == "Public")) {
      for (numberrunways=1; numberrunways<=marker.properties['numrunways']; numberrunways++) {
        var surfacenumber = "runwayType" + numberrunways;
        var lengthnumber = "runwayLength" + numberrunways;
        var widthnumber = "runwayWidth" + numberrunways;
        var surfaceok = false;
        var lengthok = false;
        var widthok = false;

        //Check surface type matches:
        if (filters['HARD'] && marker.properties[surfacenumber] == "HARD") {
          surfaceok = true;
        }
        if (filters['DIRT'] && marker.properties[surfacenumber] == "DIRT") {
          surfaceok = true;
        }
        if (filters['WATER'] && marker.properties[surfacenumber] == "WATER") {
          surfaceok = true;
        }
        if (filters['TURF'] && marker.properties[surfacenumber] == "TURF") {
          surfaceok = true;
        }

        //Check length is ok:
        if (sizefilters['maxlength'] == null) {
          sizefilters['maxlength'] = 100000;
        }
        if (marker.properties[lengthnumber] >= sizefilters['minlength'] && marker.properties[lengthnumber] <= sizefilters['maxlength']) {
          lengthok = true;
        }

        //Check width is ok:
        if (marker.properties[widthnumber] >= sizefilters['minwidth'] && marker.properties[widthnumber] <= sizefilters['maxwidth']) {  //todo - how do i get the input to show here has a variable??
          widthok = true;
        }

        //If surface, length, and width are all good for this runway, keep the marker and end this for loop:
        if (surfaceok && lengthok && widthok) {
          keep = true;  //Sets the marker to visible if it meets the criteria
          numberrunways = 20; //ends the loop
          if (userfieldslist.length > 0) {  //determines the color of the marker
            for (j = 0; j < userfieldslist.length; j++) {
              if (userfieldslist[j] == marker.title) {
                marker.setIcon("resources/green-dot.png")  //Changes marker to green if the user has been there
              }
            }
          }
        }
      }
    }
    marker.setVisible(keep)
  }
}

var map_filter = function(id_val) {  //switches filter value between true/false when clicked.
  if (filters[id_val]) {
    filters[id_val] = false;
  }
  else {
    filters[id_val] = true;
  }
}

var map_sizefilter = function(id_val) {  //updates size criteria when user inputs it.
  if ((id_val == "maxlength" || id_val == "maxwidth") && document.getElementById(id_val).value == "") {
    sizefilters[id_val] = 100000;
  }
  else if ((id_val == "minlength" || id_val == "minwidth") && document.getElementById(id_val).value == "") {
    sizefilters[id_val] = 0;
  }
  else {
    sizefilters[id_val] = document.getElementById(id_val).value;
  }
}

var map_userfieldsPrepper = function(id_val) {  //takes user input and creates an array
  var userfieldsRawInput = document.getElementById(id_val).value; 
  userfieldslist = userfieldsRawInput.split(",");
}

function loadMyFile() {
    var filerequest = new XMLHttpRequest()
    filerequest.open("GET", "resources/myfields.txt", false); 
    filerequest.send(null);
    var myfieldsfromfile = filerequest.responseText;
    userfieldslist = myfieldsfromfile.split(",");
}

// after the geojson is loaded, iterate through the map data to create markers
// and add the pop up (info) windows
function loadMarkers() {
  var infoWindow = new google.maps.InfoWindow()
  geojson_url = "js/airfieldData.geojson"
  $.getJSON(geojson_url, function(result) {
      // Post select to url.
      data = result['features']
      $.each(data, function(key, val) {
        var point = new google.maps.LatLng(
                parseFloat(val['geometry']['coordinates'][1]),
                parseFloat(val['geometry']['coordinates'][0]));
        var titleText = val['properties']['title']
        var descriptionText = val['properties']['description']
        var marker = new google.maps.Marker({
          position: point,
          title: titleText,
          map: map,
          properties: val['properties']
         });
        marker.setIcon("resources/red-dot.png");

        var airfieldinfo = "";
        for (numberrunways=1; numberrunways<=marker.properties['numrunways']; numberrunways++) {
          var surfacenumber = "runwayType" + numberrunways;
          var lengthnumber = "runwayLength" + numberrunways;
          var widthnumber = "runwayWidth" + numberrunways;
          airfieldinfo = airfieldinfo + marker.properties[surfacenumber] + ": " + marker.properties[lengthnumber] + "ft x " + marker.properties[widthnumber] + "ft<br/>"
        }
        var markerInfo = "<div><h3>" + titleText + "</h3>" + "<p>" + descriptionText + "<br/>(" + marker.properties['runwayUse'] + " use)" + "</p>" + "<p>" + airfieldinfo + "</p>" + "</div>";


        marker.addListener('click', function() {
          infoWindow.close()
          infoWindow.setContent(markerInfo)
          infoWindow.open(map, marker)
        });
        markers.push(marker)
        
      });
  });
}

function initMap() {
  map_options = {
    zoom: 4,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    center: {lat: 39.992847, lng: -96.902124},
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: true,
    fullscreenControl: true
  }
    
  map_document = document.getElementById('map')
  map = new google.maps.Map(map_document,map_options);
  loadMarkers()
 
}

google.maps.event.addDomListener(window, 'load', initMap);