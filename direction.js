"use strict";

let score_list=[];




//second solution
function findCrime(){
  let arraycrime = new Array();
  return $.get(`/crimes.json`, (res) => {
    console.log(res);
      for(let index in res.latitude){
          arraycrime[index]={"latitude":res.latitude[index], "longitude":res.longitude[index]};
        }
  });
  return arraycrime;
}

//the problem is here : distance NaN 37.768937 -122.4269495 undefined undefined

function calculateDistance(x1,x2,y1,y2){
  return Math.sqrt(Math.pow((x2-x1),2)+Math.pow((y2-y1),2));
}


function checkCrimesCircle(x1,y1,radius,list_coordinates){
  let list_inside_circle= [];
  

  for(let index in list_coordinates){
    if(list_coordinates[index]){
      //distance NaN 37.768937 -122.4269495 undefined undefined
      let distance=calculateDistance(x1,y1,list_coordinates[index].latitude, list_coordinates[index].longitude);
      console.log("distance", distance, x1,y1,list_coordinates[index].latitude, list_coordinates[index].longitude);
      if(distance <= radius){
        list_inside_circle.push({"lat": list_coordinates[index].latitude, "lng": list_coordinates[index].longitude});
      }
    }
  }
  return list_inside_circle; 
}

function shortest_distance(lat, lng, a, b, c){
  let d = abs((a * x1 + b * y1 + c)) / (math.sqrt(a * a + b * b));
  console.log("Perpendicular distance is", d);
}

function slope(x1, y1, x2, y2){ 
    return (y2 - y1) / (x2 - x1); 
} 

function calculateb(x1,y1,slp){
  return y1 - (slp * x1);
}


async function calculateScore2(routes){
  console.log(routes);

  let list_coordinates= await findCrime();
  console.log(list_coordinates);


  let list_scores=[];

  //for each route in the path
  for(let index in routes){
    let score=0;

    //for each step in the route
    for(let j in routes[index].legs[0].steps){

      //get the coordinates of the start and the end of the step
      let x2=routes[index].legs[0].steps[j].end_point.lat();
      let x1=routes[index].legs[0].steps[j].start_point.lat();
      let y2=routes[index].legs[0].steps[j].end_point.lng();
      let y1=routes[index].legs[0].steps[j].start_point.lng();

      //calculate radius and calculate for each crime in that radius the short_distance between the line(step) and the crime coordinate
      let radius=calculateDistance(x1,x2,y1,y2);
      console.log("radius",radius);
      let list_crimes=checkCrimesCircle(x1,y1,radius,list_coordinates);
      //problem
      console.log("list_crimes",list_crimes);
      for(let eachcrime of list_crimes){
        let m=slope(x1,y2,x2,y2);
        console.log("m",m);
        let b=calcultedb(x1,y2,m);
        console.log("b",b);
        let short_distance= shortest_distance(eachcrime.lat, eachcrime.lng, m, -1, b);
        console.log("short distance", short_distance);
        score+=short_distance;
        list_coordinates.remove(eachcrime);
      }
    }
     list_scores.push({"route":routes[index], "score":score});
  }
  console.log(list_scores);
}



//first solution
function findNeigh(){
  let arrayneigh = new Array();
  $.get(`/neighcoordinates.json`, (res) => {
      for(let index in res.name){
          arrayneigh[index]={"name":res.name[index], "count_crime":res.count_crime[index]};
        }
  });
  return arrayneigh;
}


function findCountCrime(json_neigh, neigh_name){
  for(let i=0; i<json_neigh.length;i++){
    if(json_neigh[i].name == neigh_name){
      return json_neigh[i].count_crime;
    }
  }
  return 0;
}


function checkNeigh(LAT, LNG){
  let N_name="";
  const KEY = "AIzaSyCS8bnj78vA2fuZ7dBPdNBgHmFuCbvpuus";
  let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${LAT},${LNG}&key=${KEY}`;
                return fetch(url)
                .then(response => response.json())
                .then(data => {
                  let parts = data.results[0].address_components;
                  parts.forEach(part => {
                    if (part.types.includes("neighborhood")) {
                      //we found "neighborhood" inside the data.results[0].address_components[x].types array
                      N_name=part.long_name;
                    }
                  });
                  return N_name;
                })
                .catch(err => console.warn(err.message)); 
}


let list_neighborhood=[];

async function calcultateScore(routes){
  let json_neigh = findNeigh();
  let list_score=[];
  let numbercoordinates=0;
  let score=0;

  for(let index in routes){
    let score=0;
    let numbercoordinates=0;
    let list_route_neigh=[];
    for(let j in routes[index].legs[0].steps){
      //for(let k in routes[index].legs[0].steps[j].lat_lngs){
        console.log(routes[index].legs[0].steps.length - 1);
        let latc, lngc;

        if (j !== (routes[index].legs[0].steps.length - 1)){
          latc=routes[index].legs[0].steps[j].start_point.lat();
          lngc=routes[index].legs[0].steps[j].start_point.lng();
        }
        else{
          latc=routes[index].legs[0].steps[j].end_point.lat();
          lngc=routes[index].legs[0].steps[j].end_point.lng();
        }
        
        numbercoordinates+=1;

        // check the neighborhood from the coordinates
        let neigh_name =  await checkNeigh(latc,lngc);
        

        if(neigh_name!=false){
          //find the count_crime for the neighborhood name found
          let count_crime=findCountCrime(json_neigh,neigh_name);
          list_route_neigh.push(neigh_name);
          
          score = score + count_crime;
        //} 
      }
    }
    //check the numberof crimes total to get the pcg or the number of coordinates
    score = score/numbercoordinates;
    list_neighborhood.push(list_route_neigh);
    console.log(score, routes[index]);
    //list_score.push({"route":routes[0],"score":score});
    score_list.push({"route":routes[index],"score":score});
  }
  console.log(list_neighborhood);

  return score_list;
}

let best_list_neigh=[];

function calculateminScore(scores){
  let min_score=scores[0].score;
  let min_index=0;
          for (let index=1; index< scores.length; index++){
            if(min_score > scores[index].score){
              min_score=scores[index].score;
              min_index=index;
            }
          } 
          console.log("min",min_score);
          best_list_neigh=list_neighborhood[min_index];
          console.log("best list neigh", best_list_neigh);
          return min_score;
}

function sort_score(scores){
  let list_score=[];
  for (let i=0; i<scores.length; i++){
    list_score.push(scores[i].score);
  }
  list_score.sort();
  return list_score;
}

// function showScore(list_score){
//   for (let i=0; i<list_score.length; i++){
//     console.log(list_score[i].route, list_score[i].score);
//   }
// }


var map, popup, Popup;

function initMap() {

  map = new google.maps.Map(document.getElementById('map'), {
    mapTypeControl: false,
    center: {lat: 37.773972, lng: -122.431297},
    zoom: 13
  });

  new AutocompleteDirectionsHandler(map);
}

/**
 * @constructor
 */
function AutocompleteDirectionsHandler(map) {
  this.map = map;
  this.originPlaceId = null;
  this.destinationPlaceId = null;
  this.travelMode = 'WALKING';
  this.provideRouteAlternatives = true;
  this.directionsService = new google.maps.DirectionsService;


  var originInput = document.getElementById('origin-input');
  var destinationInput = document.getElementById('destination-input');
  var modeSelector = document.getElementById('mode-selector');

  var originAutocomplete = new google.maps.places.Autocomplete(originInput);
  // Specify just the place data fields that you need.
  originAutocomplete.setFields(['place_id']);

  var destinationAutocomplete =
      new google.maps.places.Autocomplete(destinationInput);
  // Specify just the place data fields that you need.
  destinationAutocomplete.setFields(['place_id']);

  this.setupClickListener('changemode-walking', 'WALKING');
  // this.setupClickListener('changemode-transit', 'TRANSIT');
  this.setupClickListener('changemode-driving', 'DRIVING');

  this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
  this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(
      destinationInput);
  this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
}

// Sets a listener on a radio button to change the filter type on Places
// Autocomplete.
AutocompleteDirectionsHandler.prototype.setupClickListener = function(
    id, mode) {
  var radioButton = document.getElementById(id);
  var me = this;

  radioButton.addEventListener('click', function() {
    me.travelMode = mode;
    me.route();
  });
};

AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function(
    autocomplete, mode) {
  var me = this;
  autocomplete.bindTo('bounds', this.map);

  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();

    if (!place.place_id) {
      window.alert('Please select an option from the dropdown list.');
      return;
    }
    if (mode === 'ORIG') {
      me.originPlaceId = place.place_id;
    } else {
      me.destinationPlaceId = place.place_id;
    }
    me.route();
  });
};

let min_score;

let list_directionRender=[];

AutocompleteDirectionsHandler.prototype.route = function() {
  if (!this.originPlaceId || !this.destinationPlaceId) {
    return;
  }
  var me = this;

  this.directionsService.route(
      {
        origin: {'placeId': this.originPlaceId},
        destination: {'placeId': this.destinationPlaceId},
        travelMode: this.travelMode,
        provideRouteAlternatives: this.provideRouteAlternatives
      },
      async function(response, status) {
        if (status === 'OK') {
          //calculate the score of each route

          let scores = await calcultateScore(response.routes);
          console.log("scores",scores);
          console.log(response);

          //hard code to test in order to have less execution time
          // let scores = [{"route":response.routes[0], "score": 100}]
          // for (let i = 1, len = response.routes.length; i < len; i++){
          //   scores.push({"route":response.routes[i], "score": 200})
          // }

          //2nd Solution:
          // calculateScore2(response.routes);

          //calculate min of scores
          let sorted_scores= sort_score(scores);
          min_score=calculateminScore(scores);
          console.log("min score", min_score)

          //show directions
          let list_colors=['green', 'blue', 'red'];
          let list_div=['first','second','third'];
          let color='red';

          for(let i = 0, len1 = sorted_scores.length; i < len1; i++){
            for (let j = 0, len2 = scores.length; j < len2; j++) {
              if(sorted_scores[i] === scores[j].score){
                this.directionsRenderer = new google.maps.DirectionsRenderer({
                    map: this.map,
                    directions: response,
                    routeIndex: i,
                    polylineOptions:{strokeColor:list_colors[i]} 
                });
                this.directionsRenderer.setMap(map);
                list_directionRender.push({"direction":this.directionsRenderer,"div":list_div[i]});
                document.getElementById(list_div[i]).style.display = "block";
                // document.getElementById(list_colors[i]).style.display = "block";
              }
            }

          }
          $('addRoute').css('visibility', 'visible');

          
          
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      });
};

// let list_neighborhood2=[ "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Lower Nob Hill", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Mid-Market", "Mid-Market", "Mid-Market", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Tenderloin", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Mid-Market", "Civic Center", "Civic Center", "Mid-Market", "Mid-Market", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "Civic Center", "SoMa", "SoMa", "Civic Center", "Civic Center", "SoMa", "SoMa", "SoMa", "Civic Center"];





// document.querySelector('#addRoute').addEventListener('click', () => {
//   alert('Stop clicking me!');
//   console.log("inside function")
//   evt.preventDefault();

//   const formInputs = {
//     'start_address': $('#origin-input').val(),
//     'end_address': $('#destination-input').val(),
//     'name': $('#name-route').val(),
//     'score': min_score,
//     'names': list_neighborhood2
//   };

//   $.post('/chartNeighborhood', formInputs, (res) => {
//     alert(res);
//   });
// });


$("#addRoute").on("click", (evt) => {
  evt.preventDefault();

  const formInputs = {
    'start_address': $('#origin-input').val(),
    'end_address': $('#destination-input').val(),
    'name': $('#name-route').val(),
    'score': min_score,
    'list_neigh': JSON.stringify({"neigh":best_list_neigh})
  };
  print(formInputs['score']);
  console.log(formInputs);

  $.post('/addRoute', formInputs, (res) => {
     alert(res);
  });
});


$("#refresh").on("click", (evt) => {
  evt.preventDefault();
  initMap()  
});

$("#firstb").on("click", (evt) => {
  evt.preventDefault();
   
});


// for (var i = 0; i < directionsRenderers.length; i++) {
//         directionsRenderers[i].setMap(null);
//     }



// $.post( "/chartNeighborhood", {
//                   names: list_neighborhood
//               });

// function JSalert(){
//   swal("Congrats!", ", Your account is created!", "success");
// }



   