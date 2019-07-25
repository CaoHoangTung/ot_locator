const rootURL = 'https://hoangtung1.localtunnel.me';

// ---------------------- Initializing JQuery --------------------------------

(function () {

  /* Load Script function we may need to load jQuery from the Google's CDN */

  let loadScript = function (url, callback) {

    let script = document.createElement("script");
    script.type = "text/javascript";

    // If the browser is Internet Explorer.
    if (script.readyState) {
      script.onreadystatechange = function () {
        if (script.readyState == "loaded" || script.readyState == "complete") {
          script.onreadystatechange = null;
          callback();
        }
      };
      // For any other browser.
    } else {
      script.onload = function () {
        callback();
      };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);

  };

  /* This is my app's JavaScript */
  let myAppJavaScript = function ($) {
    // $ in this scope references the jQuery object we'll use.
    // Don't use jQuery, or jQuery191, use the dollar sign.
    // Do this and do that, using $.
    console.log('Your app is using jQuery version ' + $.fn.jquery);
  };

  /* If jQuery has not yet been loaded or if it has but it's too old for our needs,
  we will load jQuery from the Google CDN, and when it's fully loaded, we will run
  our app's JavaScript. Set your own limits here, the sample's code below uses 1.7
  as the minimum version we are ready to use, and if the jQuery is older, we load 1.9. */
  if ((typeof jQuery === 'undefined') || (parseFloat(jQuery.fn.jquery) < 1.7)) {
    loadScript('//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js', function () {
      jQuery191 = jQuery.noConflict(true);
      myAppJavaScript(jQuery191);
    });
  } else {
    myAppJavaScript(jQuery);
  }

})();


// ---------------------------------- finish loading JQuery ----------------------------

async function getOptions() {
  return await $.ajax({
    url: `${rootURL}/storefront/settings`,
    method: 'get',
    data: {
      shop: window.location.hostname,
    }
  });
}

async function getLocations() {
  return await $.ajax({
    url: `${rootURL}/storefront/locations/all`,
    method: 'get',
    data: {
      shop: window.location.hostname,
    }
  });
}

async function generateHTML(settings) {
  let locationsResult = await getLocations();
  let locations = locationsResult.locations;
  
  return `
  
    <style>
      /* Always set the map height explicitly to define the size of the div
       * element that contains the map. */
      #map {
        height: 60vh;
        position: relative;
        width: 55vw;
        float: left;
        height: 50vh;
      }
      #locationList {
        width: 35vw;
        position: relative;
        float: left;
        height: 50vh;
        overflow: scroll
      }
      
      #mapSectionContainer{
        display: inline-block;
        text-align: center;
        padding: 5vw
      }

      #mapSectionHeader {
        margin-bottom: 5vh
      }

      @media(max-width: 650px){
        #map {
          width: 90vw !important;
        }
        #locationList {
          width: 90vw !important;
        }
      }
    </style>
    <div id="mapSectionContainer">
      <h2 id="mapSectionHeader">${settings.sectionHeader}</h2>
      <div id="map"></div>
      <div class="list-group" id="locationList">
        
      </div>
    </div>
    <script>

      let locations = ${JSON.stringify(locations)};

      var map, infoWindow, pos;
      // pos is geolocation of user
      var fetchDistanceCompleted = 0;

      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
        });
        
        infoWindow = new google.maps.InfoWindow;
        let arrangeDistancePromises = []; // list of promises that corrseponded to a pair of places

        // Try HTML5 geolocation.
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            map.setCenter(pos); // set map center to user's current position
            fetchDistanceAndSortLocationList();
            displayCurrentPosition();
            
          }, function() {
            console.log("CANNOT FETCH LOCATION");
            map.setCenter({lat: 10, lng: 100});
            fetchDistanceAndSortLocationList();
            handleLocationError(true, infoWindow, map.getCenter());
          });
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }

        displayMarkers();
      }

      function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed. Please turn it on so we can suggest the nearest store' :
                              'Error: Your browser does not support geolocation.');
        infoWindow.open(map);
      }

      function fetchDistanceAndSortLocationList(){
        // if user's current location has been fetched
        if (pos){
          console.log("FETCHING");
          // fetch distance
          let destination = pos // destination = user's current position
          
          let simplifyLocations = []; // contains list of locations, use for google distance matrix
          for (let index = 0 ; index < locations.length ; index++){
            let curLocation = locations[index];
            simplifyLocations.push(curLocation.address);
            console.log("PUSHING ",curLocation.address); 
          }

          let distanceMatrix = []; // contains distances of locations
          let service = new google.maps.DistanceMatrixService();
          service.getDistanceMatrix(
            {
              origins: simplifyLocations,
              destinations: [destination],
              travelMode: 'DRIVING',
            }, callback);

          function callback(response, status) {
            console.log(locations);
            console.log(response);

            let results = response.rows;
            for (let index in results){
              locations[index].estimation = results[index].elements[0]; // contains distance and duration to user's current position            
            }
            
            // now sort the locations list
            for (let index1 = 0 ; index1 < locations.length-1 ; index1++){
              for (let index2 = index1+1 ; index2 < locations.length ; index2++){
                if (locations[index1].estimation.distance.value > locations[index2].estimation.distance.value){
                  [locations[index1],locations[index2]] = [locations[index2],locations[index1]];
                }
              }
            }

            // display the location list after sort
            displayLocationList();
          }
        }
        else{ // if cannot get user's current location
          // display location list with wrong distance estimations
          displayLocationList();
        }
        
      }
      
      function displayLocationList(){
        console.log("Displaying location list");
        $('#locationList').empty();

        for (let index in locations){ 
          let curlocation = locations[index];

          let latlng = {lat: curlocation.lat, lng: curlocation.lng};
          
          if (curlocation.estimation !== undefined) // if user's location has been fetched, and the distance has been calculated
            $('#locationList').append("<button type='button' class='list-group-item list-group-item-action' onclick='position="+JSON.stringify(latlng)+"; map.setCenter(position);'><b>"+curlocation.address+"</b><br>( "+curlocation.estimation.distance.text+" ~ "+curlocation.estimation.duration.text+" )</button>");
          else // if no distances provided
            $('#locationList').append("<button type='button' class='list-group-item list-group-item-action' onclick='position="+JSON.stringify(latlng)+"; map.setCenter(position);'><b>"+curlocation.address+"</b></button>");
        }
      }


      // display user's current position
      function displayCurrentPosition(){
        // display current location marker
        var image = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
        let marker = new google.maps.Marker({
          position: pos,
          map: map,
          icon: image,
        });
      }

      function displayMarkers(){
        console.log("Displaying markers");
        
        // display stores marker
        for (let index in locations){ 
          let curlocation = locations[index];
    
          let latlng = {lat: curlocation.lat, lng: curlocation.lng};
          
          let contentString = '<div id="content">'+
              '<div id="siteNotice">'+
              '</div>'+
              '<h4 id="firstHeading" class="firstHeading">'+curlocation.address+'</h4>'+
              '</div>';

          let infowindow = new google.maps.InfoWindow({
            content: contentString
          });


          let marker = new google.maps.Marker({
            position: latlng,
            map: map,
            title: curlocation.address
          });
          marker.addListener('click', function() {
            infowindow.open(map, marker);
          });
        }
      }
    </script>
    <script src="https://maps.googleapis.com/maps/api/js?key=${settings.googleAPIKey}&callback=initMap"
    async defer></script>`
}

async function appendMap() {
  let settings = await getOptions();
  let appendToClassOrId = settings.wrapperClass;

  let html = await generateHTML(settings);


  console.log(settings);
  $(`${appendToClassOrId}`).append(html);
}

function loadBootstrap(){
  $('head').prepend(`
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous"></link>
    `)
}

loadBootstrap();
appendMap();