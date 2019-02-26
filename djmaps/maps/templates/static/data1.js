$.getJSON("./static/dataCrime1.json", function(dC) {
	var dataCrimes = dC;
	//var fs = require("fs");
	//var datesFromOrdinal = fs.readFileSync("./static/ordinalToDate.txt").toString().split("\n");
	/*for(var i = 0; i < datesFromOrdinal.length; i++) {
		console.log(datesFromOrdinal[i]);
	}*/

	var filterGroup = document.getElementById('filter-group');

	mapboxgl.accessToken = 'pk.eyJ1Ijoia2F0aGxlZW54dWUiLCJhIjoiY2pyOXU5Z3JlMGxiNzQ5cGgxZmo5MWhzeiJ9.xyOwT8LWfjpOlEvPF2Iy7Q';
		const map = new mapboxgl.Map({
		container: 'map',
		//style: 'mapbox://styles/kathleenxue/cjrd2z9b43cef2spckex2oq0z',
		style: 'mapbox://styles/mapbox/light-v9',
		center: [-118.2851,34.0226],
		zoom: 14
	});

	var ct = new Set();
	var days = new Set();
	for(var i = 0; i < dataCrimes.features.length; i++) {
		ct.add(dataCrimes.features[i].properties.Category);
		//console.log(dataCrimes.features[i].properties.Category);
		days.add(dataCrimes.features[i].properties.time.toString());
	}

	var crimeType = new Array();

	ct.forEach(function(value) {
		crimeType.push(value);
	});

	crimeType.sort();

	var dateCommitted = new Array();
	var timeCommitted = new Array();

	days.forEach(function(value) {
		dateCommitted.push(value);
		timeCommitted.push(value);
		//console.log(value);
	});

	$("#crimeType").append("<input class = 'change' type = 'checkbox' id = 'crimeType-ALL' name = 'crimeType-ALL' font='sans-serif' checked></input>");
	$("#crimeType").append("<label for = 'crimeType-ALL'> Select All</label><br>");

	$("#crimeType").append("<input class = 'change' type = 'checkbox' id = 'crimeType-NONE' name = 'crimeType-NONE' font='sans-serif'></input>");
	$("#crimeType").append("<label for = 'crimeType-NONE'> Select None</label><br><br>");

	for(var i = 0; i < crimeType.length; i++) {
		$("#crimeType").append("<input class = 'change' type = 'checkbox' id = 'crimeType-" + crimeType[i] + "' name = 'crimeType-" + crimeType[i] + "' font='sans-serif' checked></input>");
		$("#crimeType").append("<label for = 'crimeType-" + crimeType[i] + "'> " + crimeType[i] + "</label><br>");
	}

	$("#dates").append("<input class = 'change' type = 'checkbox' id = 'day-ALL' name = 'day-ALL' font='sans-serif' checked></input>");
	$("#dates").append("<label for = 'day-ALL'>Select All</label><br>");

	$("#dates").append("<input class = 'change' type = 'checkbox' id = 'day-NONE' name = 'day-NONE' font='sans-serif'></input>");
	$("#dates").append("<label for = 'day-NONE'>Select None</label><br>");

	$("#dates").append("<br><b>Filter by Date Range</b><br>");
	$("#dates").append("<input data-dependent-validation='{'from': 'date-to', 'prop': 'max'}' class = 'change' type = 'date' id='date-from' name='date-from' placeholder='from'></input>");
	$("#dates").append("<input data-dependent-validation='{'from': 'date-from', 'prop': 'min'}' class = 'change' type = 'date' id='date-to' name='date-to' placeholder='to'></input>");
	$("#dates").append("<input class='change' type='submit' id='submit' name='submit' /><br>");
	
	$("#dates").append("<br><b>Filter by Day of Week</b><br>");
	$("#dates").append("<input class = 'change' type = 'checkbox' id='day-Mondays' name='day-Mondays' font='sans-serif' checked></input>");
	$("#dates").append("<label for = 'day-Mondays'>Mondays</label><br>");
	$("#dates").append("<input class = 'change' type = 'checkbox' id='day-Tuesdays' name='day-Tuesdays' font='sans-serif' checked></input>");
	$("#dates").append("<label for = 'day-Tuesdays'>Tuesdays</label><br>");
	$("#dates").append("<input class = 'change' type = 'checkbox' id='day-Wednesdays' name='day-Wednesdays' font='sans-serif' checked></input>");
	$("#dates").append("<label for = 'day-Wednesdays'>Wednesdays</label><br>");
	$("#dates").append("<input class = 'change' type = 'checkbox' id='day-Thursdays' name='day-Thursdays' font='sans-serif' checked></input>");
	$("#dates").append("<label for = 'day-Thursdays'>Thursdays</label><br>");
	$("#dates").append("<input class = 'change' type = 'checkbox' id='day-Fridays' name='day-Fridays' font='sans-serif' checked></input>");
	$("#dates").append("<label for = 'day-Fridays'>Fridays</label><br>");
	$("#dates").append("<input class = 'change' type = 'checkbox' id='day-Saturdays' name='day-Saturdays' font='sans-serif' checked></input>");
	$("#dates").append("<label for = 'day-Saturdays'>Saturdays</label><br>");
	$("#dates").append("<input class = 'change' type = 'checkbox' id='day-Sundays' name='day-Sundays' font='sans-serif' checked></input>");
	$("#dates").append("<label for = 'day-Sundays'>Sundays</label>");
		//$("#dates").append("<label for = 'day-" + dateCommitted[i] + "'> " + datesFromOrdinal[i] + "</label>");

	$("#timeOfDay").append("<input class = 'change' type = 'checkbox' id='tod-ALL' name='tod-ALL' font='sans-serif' checked></input>");
	$("#timeOfDay").append("<label for = 'tod-ALL'>Select All</label><br>");
	$("#timeOfDay").append("<input class = 'change' type = 'checkbox' id='tod-NONE' name='tod-NONE' font='sans-serif'></input>");
	$("#timeOfDay").append("<label for = 'tod-Morning'>Select None</label><br>");
	$("#timeOfDay").append("<input class = 'change' type = 'checkbox' id='tod-Morning' name='tod-Morning' font='sans-serif' checked></input>");
	$("#timeOfDay").append("<label for = 'tod-Morning'>Morning (5 am to 10 am)</label><br>");
	$("#timeOfDay").append("<input class = 'change' type = 'checkbox' id='tod-Noon' name='tod-Noon' font='sans-serif' checked></input>");
	$("#timeOfDay").append("<label for = 'tod-Noon'>Noon (11 am to 2 pm)</label><br>");
	$("#timeOfDay").append("<input class = 'change' type = 'checkbox' id='tod-Afternoon' name='tod-Afternoon' font='sans-serif' checked></input>");
	$("#timeOfDay").append("<label for = 'tod-Afternoon'>Afternoon (3 pm to 6 pm)</label><br>");
	$("#timeOfDay").append("<input class = 'change' type = 'checkbox' id='tod-Evening' name='tod-Evening' font='sans-serif' checked></input>");
	$("#timeOfDay").append("<label for = 'tod-Evening'>Evening (7 pm to 11 pm)</label><br>");
	$("#timeOfDay").append("<input class = 'change' type = 'checkbox' id='tod-Night' name='tod-Night' font='sans-serif' checked></input>");
	$("#timeOfDay").append("<label for = 'tod-Night'>Night (12 am to 4 am)</label><br>");

	map.on('load', function() {
		map.addSource("dataCrimes", {
			"type": "geojson",
			"data": dataCrimes
		});

		map.addLayer({
			"id": "crimes",
			"type": "symbol",
			"source": "dataCrimes",
			"layout": {
				"icon-image": "circle-11",
				"icon-allow-overlap": true
			}
		});
		var popup = new mapboxgl.Popup({
			closeButton: false,
			closeOnClick: false
		});

		map.on('mouseenter', 'crimes', function(e) {
		// Change the cursor style as a UI indicator.
			map.getCanvas().style.cursor = 'pointer';
			 
			var coordinates = e.features[0].geometry.coordinates.slice();
			var crimeDate = e.features[0].properties.time;
			var crimeMonth = crimeDate.slice(5,7);
			var crimeDay = crimeDate.slice(8,10);
			var crimeYear = crimeDate.slice(0,4);
			var crimeTime = crimeDate.slice(11,16);
			var description = "<b>Type: " + e.features[0].properties.Category + "</b><br>Date: " 
				+ crimeMonth + "-" + crimeDay + "-" + crimeYear + "<br>"
				+ "Time: " + crimeTime + ":00 PST<br>";
			 
			// Ensure that if the map is zoomed out such that multiple
			// copies of the feature are visible, the popup appears
			// over the copy being pointed to.
			while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
				coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			}
			 
			// Populate the popup and set its coordinates
			// based on the feature found.
			popup.setLngLat(coordinates)
			.setHTML(description)
			.addTo(map);
		});
		 
		map.on('mouseleave', 'crimes', function() {
			map.getCanvas().style.cursor = '';
			popup.remove();
		});

		map.setFilter("crimes", ["all"]);
	});

	

	var dateFrom = new Date(0,0,0);
	var dateTo = new Date(0,0,0);
	var numDaysOfWeekChecked = 7;
	var numTimesOfDayChecked = 5;
	var morningStart = 5;
	var morningEnd = 10;
	var noonStart = 11;
	var noonEnd = 14;
	var afternoonStart = 15;
	var afternoonEnd = 18;
	var eveningStart = 19;
	var eveningEnd = 23;
	var nightStart = 0;
	var nightEnd = 4;


	$(document).ready(function() {
		$("#submit").click(function() {
			dateCommitted = ["none"];
    		dateFrom = document.getElementById("date-from").value;
    		dateTo = document.getElementById("date-to").value;
    		//console.log(dateFrom);
    		//console.log(dateTo);
	    	//convert dateFrom and dateTo to python ordinal dates
	    	for(var i = Date.parse(dateFrom) + 8.64e+7; i <= Date.parse(dateTo) + 8.64e+7; i+=8.64e+7) {
	    		var i_ = new Date(i);
	    		curDate = i_.getDate();
	    		var cDate = '' + curDate;
	    		if(curDate < 10) cDate = "0" + curDate.toString();
	    		curMonth = i_.getMonth() + 1;
	    		var cMonth = curMonth.toString();
	    		if(curMonth < 10) cMonth = "0" + curMonth.toString();
	    		curYear = i_.getFullYear();
	    		var cYear = curYear.toString();
	    		dateCommitted.push(cYear + "-" + cMonth + "-" + cDate);
	    		//console.log(cYear + "-" + cMonth + "-" + cDate);
	    	}
	    	$("#dates input[name='day-ALL']:checkbox").prop('checked', false);
	    	$("#dates input[name='day-NONE']:checkbox").prop('checked', false);
	    	$("#dates input[name='day-Mondays']:checkbox").prop('checked', false);
	    	$("#dates input[name='day-Tuesdays']:checkbox").prop('checked', false);
	    	$("#dates input[name='day-Wednesdays']:checkbox").prop('checked', false);
	    	$("#dates input[name='day-Thursdays']:checkbox").prop('checked', false);
	    	$("#dates input[name='day-Fridays']:checkbox").prop('checked', false);
	    	$("#dates input[name='day-Saturdays']:checkbox").prop('checked', false);
	    	$("#dates input[name='day-Sundays']:checkbox").prop('checked', false);
	    	map.setFilter("crimes", ["all", ["match", ["get", "Category"], crimeType, true, false], ["match", ["get", "time"], dateCommitted, true, false], ["match", ["get", "time"], timeCommitted, true, false]]);
		});


	    $(".change").change(function() {
	    	
	        	if ($(this).prop("checked")) {
		        	if($(this).prop("name").slice(0,3) == "day") {
		        		if($(this).prop("name").slice(4) == "ALL") {
		        			dateCommitted = ["none"];
		        			days.forEach(function(value) {
								dateCommitted.push(value.toString());
							});
							$("#dates input[name='day-NONE']:checkbox").prop('checked', false);
							$("#dates input[name='day-Mondays']:checkbox").prop('checked', true);
							$("#dates input[name='day-Tuesdays']:checkbox").prop('checked', true);
							$("#dates input[name='day-Wednesdays']:checkbox").prop('checked', true);
							$("#dates input[name='day-Thursdays']:checkbox").prop('checked', true);
							$("#dates input[name='day-Fridays']:checkbox").prop('checked', true);
							$("#dates input[name='day-Saturdays']:checkbox").prop('checked', true);
							$("#dates input[name='day-Sundays']:checkbox").prop('checked', true);
							numDaysOfWeekChecked = 7;
		        		}
		        		else if($(this).prop("name").slice(4) == "NONE") {
		        			dateCommitted = ["none"];
		        			$("#dates input[name='day-ALL']:checkbox").prop('checked', false);
		        			$("#crimeType input:checkbox").prop('checked', true);
		        			$("#crimeType input[name='crimeType-NONE']:checkbox").prop('checked', false);
		        			$("#crimeType input[name='crimeType-ALL']:checkbox").prop('checked', true);
		        			$("#dates input[name='day-NONE']:checkbox").prop('checked', true);
		        			$("#dates input[name='day-Mondays']:checkbox").prop('checked', false);
							$("#dates input[name='day-Tuesdays']:checkbox").prop('checked', false);
							$("#dates input[name='day-Wednesdays']:checkbox").prop('checked', false);
							$("#dates input[name='day-Thursdays']:checkbox").prop('checked', false);
							$("#dates input[name='day-Fridays']:checkbox").prop('checked', false);
							$("#dates input[name='day-Saturdays']:checkbox").prop('checked', false);
							$("#dates input[name='day-Sundays']:checkbox").prop('checked', false);
							numDaysOfWeekChecked = 0;
		        		}
		        		else {
		        			numDaysOfWeekChecked += 1;
		        			if(numDaysOfWeekChecked == 1 || numDaysOfWeekChecked == 7) {
		        				if(numDaysOfWeekChecked == 1) {
		        					dateCommitted = ["none"];
			        				$("#dates input[name='day-NONE']:checkbox").prop('checked', false);
			        				$("#dates input[name='day-ALL']:checkbox").prop('checked', false);
			        				$("#crimeType input:checkbox").prop('checked', true);
			        				$("#crimeType input[name='crimeType-NONE']:checkbox").prop('checked', false);
		        				}
		        				else {
		        					$("#dates input[name='day-ALL']:checkbox").prop('checked', true);
		        					$("#crimeType input:checkbox").prop('checked', true);
		        					$("#crimeType input[name='crimeType-NONE']:checkbox").prop('checked', false);
		        				}
		        			}
		        			
		        			if($(this).prop("name").slice(4) == "Mondays") {
			        			days.forEach(function(value) {
			        				var curDate = new Date(value);
			        				if(curDate.getDay() == 1) {
			        					dateCommitted.push(value);
			        				}
			        			});
		        			}
		        			if($(this).prop("name").slice(4) == "Tuesdays") {
			        			days.forEach(function(value) {
			        				var curDate = new Date(value);
			        				if(curDate.getDay() == 2) dateCommitted.push(value);
			        			});
		        			}
		        			if($(this).prop("name").slice(4) == "Wednesdays") {
			        			days.forEach(function(value) {
			        				var curDate = new Date(value);
			        				if(curDate.getDay() == 3) dateCommitted.push(value);
			        			});
		        			}
		        			if($(this).prop("name").slice(4) == "Thursdays") {
			        			days.forEach(function(value) {
			        				var curDate = new Date(value);
			        				if(curDate.getDay() == 4) dateCommitted.push(value);
			        			});
		        			}
		        			if($(this).prop("name").slice(4) == "Fridays") {
			        			days.forEach(function(value) {
			        				var curDate = new Date(value);
			        				if(curDate.getDay() == 5) dateCommitted.push(value);
			        			});
		        			}
		        			if($(this).prop("name").slice(4) == "Saturdays") {
			        			days.forEach(function(value) {
			        				var curDate = new Date(value);
			        				if(curDate.getDay() == 6) dateCommitted.push(value);
			        			});
		        			}
		        			if($(this).prop("name").slice(4) == "Sundays") {
			        			days.forEach(function(value) {
			        				var curDate = new Date(value);
			        				if(curDate.getDay() == 0) dateCommitted.push(value);
			        			});
		        			}

		        			for(var i = 0; i < dateCommitted.length; i++) {
		        				var curDate = new Date(dateCommitted[i]);
		        				console.log(curDate);
		        			}
		        		}
		        		/*else {
		        			dateCommitted.push($(this).prop("name").slice(4).toString());
		        			//console.log(dateCommitted[dateCommitted.length - 1]);
		        			$("#dates input[name='day-NONE']:checkbox").prop('checked', false);
		        		}*/
		        	}

		        	else if($(this).prop("name").slice(0,3) == "tod") {
		        		if($(this).prop("name").slice(4) == "ALL") {
		        			numTimesOfDayChecked = 5;
		        			dateCommitted = ["none"];
		        			days.forEach(function(value) {
								dateCommitted.push(value.toString());
							});
							$("#timeOfDay input[name='tod-ALL']:checkbox").prop('checked', true);
							$("#timeOfDay input[name='tod-NONE']:checkbox").prop('checked', false);
							$("#timeOfDay input[name='tod-Morning']:checkbox").prop('checked', true);
		        			$("#timeOfDay input[name='tod-Noon']:checkbox").prop('checked', true);
		        			$("#timeOfDay input[name='tod-Afternoon']:checkbox").prop('checked', true);
		        			$("#timeOfDay input[name='tod-Evening']:checkbox").prop('checked', true);
		        			$("#timeOfDay input[name='tod-Night']:checkbox").prop('checked', true);
		        			for(var i = 0; i < dateCommitted.length; i++) {
		        				var curTime = new Date(dateCommitted[i]);
		        				console.log(curTime.getHours());
		        			}
		        		}
		        		if($(this).prop("name").slice(4) == "NONE") {
		        			timeCommitted = ["none"];
		        			numTimesOfDayChecked = 0;
		        			$("#timeOfDay input[name='tod-ALL']:checkbox").prop('checked', false);
		        			$("#timeOfDay input[name='tod-Morning']:checkbox").prop('checked', false);
		        			$("#timeOfDay input[name='tod-Noon']:checkbox").prop('checked', false);
		        			$("#timeOfDay input[name='tod-Afternoon']:checkbox").prop('checked', false);
		        			$("#timeOfDay input[name='tod-Evening']:checkbox").prop('checked', false);
		        			$("#timeOfDay input[name='tod-Night']:checkbox").prop('checked', false);
		        		}
		        		else {
		        			numTimesOfDayChecked += 1;
		        			if(numTimesOfDayChecked == 1) {
		        				timeCommitted = ["none"];
		        				$("#timeOfDay input[name='tod-NONE']:checkbox").prop('checked', false);
		        			}
		        			if(numTimesOfDayChecked == 5) {
		        				$("#timeOfDay input[name='tod-ALL']:checkbox").prop('checked', true);
		        				$("#timeOfDay input[name='tod-NONE']:checkbox").prop('checked', false);
		        			}
			        		if($(this).prop("name").slice(4) == "Morning") {
			        			days.forEach(function(value) {
			        				var curTime = new Date(value);
			        				if(curTime.getHours() >= 5 && curTime.getHours() <= 10) timeCommitted.push(value);
			        			});
			        		}
			        		if($(this).prop("name").slice(4) == "Noon") {
			        			days.forEach(function(value) {
			        				var curTime = new Date(value);
			        				if(curTime.getHours() >= 11 && curTime.getHours() <= 14) timeCommitted.push(value);
			        			});
			        		}
			        		if($(this).prop("name").slice(4) == "Afternoon") {
			        			days.forEach(function(value) {
			        				var curTime = new Date(value);
			        				if(curTime.getHours() >= 15 && curTime.getHours() <= 18) timeCommitted.push(value);
			        			});
			        		}
			        		if($(this).prop("name").slice(4) == "Evening") {
			        			days.forEach(function(value) {
			        				var curTime = new Date(value);
			        				if(curTime.getHours() >= 19 && curTime.getHours() <= 23) timeCommitted.push(value);
			        			});
			        		}
			        		if($(this).prop("name").slice(4) == "Night") {
			        			days.forEach(function(value) {
			        				var curTime = new Date(value);
			        				if(curTime.getHours() >= 0 && curTime.getHours() <= 4) timeCommitted.push(value);
			        			});
			        		}
		        		}
		        	}

		        	else if($(this).prop("name").slice(0,9) == "crimeType") {
		        		if($(this).prop("name").slice(10) == "ALL") {
		        			crimeType = ["none"];
		        			ct.forEach(function(value) {
								crimeType.push(value);
							});
							$('#crimeType input:checkbox').prop('checked', true);
							$("#crimeType input[name='crimeType-NONE']:checkbox").prop('checked', false);
		        		}
		        		else if($(this).prop("name").slice(10) == "NONE") {
		        			//console.log(crimeType[crimeType.length - 1]);
		        			crimeType = ["none"];
		        			$('#crimeType input:checkbox').prop('checked', false);	
		        			$("#dates input[name='day-ALL']:checkbox").prop('checked', true);
		        			$("#dates input[name='day-NONE']:checkbox").prop('checked', false);
		        			$("#crimeType input[name='crimeType-NONE']:checkbox").prop('checked', true);
		        		}
		        		else {
		        			crimeType.push($(this).prop("name").slice(10));
		        			//console.log(crimeType[crimeType.length - 1]);
		        			$("#crimeType input[name='crimeType-NONE']:checkbox").prop('checked', false);
		        		}
		        	}
		            // if a day was checked add to dates array
		            // if a type was checked add to types array
		        } else {
		        	/*if($(this).prop("name").slice(0,3) == "day") {
		        		//console.log($(this).prop("name"));
		        		for(var i = 0; i < dateCommitted.length; i++) {
			        		if($(this).prop("name").slice(4) == dateCommitted[i]) dateCommitted.splice(i,1);
			        	}
			        	$("#dates input[name='day-ALL']:checkbox").prop('checked', false);
		        	}*/
		        	
		        	if($(this).prop("name").slice(0,9) == "crimeType") {
		        		//console.log($(this).prop("name"));
		        		for(var i = crimeType.length - 1; i >= 0; i--) {
		        			if($(this).prop("name").slice(10) == crimeType[i]) crimeType.splice(i,1);
		        		}
		        		$("#crimeType input[name='crimeType-ALL']:checkbox").prop('checked', false);
		        	}
		            // if a day was unchecked delete it from dates array
		            // if a type was unchecked delete it from types array
		            else if($(this).prop("name").slice(0,3) == "tod") {
		            	numTimesOfDayChecked -= 1;
		            	$("#timeOfDay input[name='tod-ALL']:checkbox").prop("checked", false);
		            	if(numTimesOfDayChecked == 0) {
		            		$("#timeOfDay input[name='tod-NONE']:checkbox").prop('checked', true);
		            	}
		            	if($(this).prop("name").slice(4) == "Morning") {
		            		for(var i = timeCommitted.length - 1; i >= 0; i--) {
		            			var curTime = new Date(timeCommitted[i]);
		            			if(curTime.getHours() >= morningStart && curTime.getHours() <= morningEnd) timeCommitted.splice(i, 1);
		            		}
		            	}
		            	if($(this).prop("name").slice(4) == "Noon") {
		            		for(var i = timeCommitted.length - 1; i >= 0; i--) {
		            			var curTime = new Date(timeCommitted[i]);
		            			if(curTime.getHours() >= noonStart && curTime.getHours() <= noonEnd) timeCommitted.splice(i, 1);
		            		}
		            	}
		            	if($(this).prop("name").slice(4) == "Afternoon") {
		            		for(var i = timeCommitted.length - 1; i >= 0; i--) {
		            			var curTime = new Date(timeCommitted[i]);
		            			if(curTime.getHours() >= afternoonStart && curTime.getHours() <= afternoonEnd) timeCommitted.splice(i, 1);
		            		}
		            	}
		            	if($(this).prop("name").slice(4) == "Evening") {
		            		for(var i = timeCommitted.length - 1; i >= 0; i--) {
		            			var curTime = new Date(timeCommitted[i]);
		            			if(curTime.getHours() >= eveningStart && curTime.getHours() <= eveningEnd) timeCommitted.splice(i, 1);
		            		}
		            	}
		            	if($(this).prop("name").slice(4) == "Night") {
		            		for(var i = timeCommitted.length - 1; i >= 0; i--) {
		            			var curTime = new Date(timeCommitted[i]);
		            			if(curTime.getHours() >= nightStart && curTime.getHours() <= nightEnd) timeCommitted.splice(i, 1);
		            		}
		            	}
		            }
		            else {
		            	$("#dates input[name='day-ALL']:checkbox").prop('checked', false);
		            	numDaysOfWeekChecked -= 1;
		            	if(numDaysOfWeekChecked == 0) {
		            		$("#dates input[name='day-NONE']:checkbox").prop('checked', true);
		            	}
		            	if($(this).prop("name").slice(4) == "Mondays") {
		            		for(var i = dateCommitted.length - 1; i >= 0; i--) {
		            			var curDate = new Date(dateCommitted[i]);
		            			if(curDate.getDay() == 1) {
		            				dateCommitted.splice(i,1);
		            			}
		            		}
		            	}
		            	else if($(this).prop("name").slice(4) == "Tuesdays") {
		            		for(var i = dateCommitted.length - 1; i >= 0; i--) {
		            			var curDate = new Date(dateCommitted[i]);
		            			if(curDate.getDay() == 2) dateCommitted.splice(i,1);
		            		}
		            	}
		            	else if($(this).prop("name").slice(4) == "Wednesdays") {
		            		for(var i = dateCommitted.length - 1; i >= 0; i--) {
		            			var curDate = new Date(dateCommitted[i]);
		            			if(curDate.getDay() == 3) dateCommitted.splice(i,1);
		            		}
		            	}
		            	else if($(this).prop("name").slice(4) == "Thursdays") {
		            		for(var i = dateCommitted.length - 1; i >= 0; i--) {
		            			var curDate = new Date(dateCommitted[i]);
		            			if(curDate.getDay() == 4) dateCommitted.splice(i,1);
		            		}
		            	}
		            	else if($(this).prop("name").slice(4) == "Fridays") {
		            		for(var i = dateCommitted.length - 1; i >= 0; i--) {
		            			var curDate = new Date(dateCommitted[i]);
		            			if(curDate.getDay() == 5) dateCommitted.splice(i,1);
		            		}
		            	}
		            	else if($(this).prop("name").slice(4) == "Saturdays") {
		            		for(var i = dateCommitted.length - 1; i >= 0; i--) {
		            			var curDate = new Date(dateCommitted[i]);
		            			if(curDate.getDay() == 6) dateCommitted.splice(i,1);
		            		}
		            	}
		            	else if($(this).prop("name").slice(4) == "Sundays") {
		            		for(var i = dateCommitted.length - 1; i >= 0; i--) {
		            			var curDate = new Date(dateCommitted[i]);
		            			if(curDate.getDay() == 0) dateCommitted.splice(i,1);
		         
		            		}
		            	}
		            }
	    		}
	        // modify the next line to also work dates
	        map.setFilter("crimes", ["all", ["match", ["get", "Category"], crimeType, true, false], ["match", ["get", "time"], timeCommitted, true, false], ["match", ["get", "time"], dateCommitted, true, false]]);
	    });
	});
});



