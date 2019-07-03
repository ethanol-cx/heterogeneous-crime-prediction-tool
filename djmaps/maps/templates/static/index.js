let dateFrom = new Date(0, 0, 0);
let dateTo = new Date(0, 0, 0);
let numDaysOfWeekChecked = 7;
let numTimesOfDayChecked = 5;
let morningStart = 5;
let morningEnd = 10;
let noonStart = 11;
let noonEnd = 14;
let afternoonStart = 15;
let afternoonEnd = 18;
let eveningStart = 19;
let eveningEnd = 23;
let nightStart = 0;
let nightEnd = 4;

let dataCrimes;
let dbPredict = [];
let clusterOfEachPoint = [];
let timeseriesToPredict = [];
let periodsAhead = 1;

function rgbToHex(color) {
	let hex = Number(color).toString(16);
	if (hex.length < 2) {
		hex = "0" + hex;
	}
	return hex;
}

function fullRGBtoHex(r, g, b) {
	let red = rgbToHex(r);
	let green = rgbToHex(g);
	let blue = rgbToHex(b);
	return red + green + blue;
}

/* FOR THE COLORS FUNCTION BELOW
'match', ["get", "0.05cluster"], "-1", "#000000",
		"0", "#a9a9a9", "1", "#cc0000",
		"2", "#cc6600", "3", "#cccc00",
		"4", "#66cc00", "5", "#00cccc",
		"6", "#0066cc", "7", "#0000cc",
		"8", "#6600cc", "9", "#cc00cc",
		"10", "#cc0066", "11", "#ff0000",
		"12", "#ff8000", "13", "#ffff00",
		"14", "#80ff00", "15", "#00ff80",
		"16", "#00ffff", "17", "#0080ff",
		"#ff99ff" <---FUNCTION BELOW (colors(DBSCANdistance)) INTENDED TO
					  OUTPUT ARRAY THAT MATCHES THIS ARRAY
*/

function colors(DBSCANdistance) {
	let colorArr = new Array();
	let usedColors = new Set();

	colorArr.push("match");

	let specifyClusterDistance = new Array();
	specifyClusterDistance.push("get");
	specifyClusterDistance.push(String(DBSCANdistance));

	colorArr.push(specifyClusterDistance);
	colorArr.push("-1");
	colorArr.push("#000000");
	colorArr.push("0");
	colorArr.push("#ff8080");

	usedColors.add("#000000");
	usedColors.add("#ff8080");
	usedColors.add("#a9a9a9");

	let i = 1;
	while (colorArr.length < 1024) {
		let rColor = Math.floor(Math.random() * 256);
		let gColor = Math.floor(Math.random() * 256);
		let bColor = Math.floor(Math.random() * 256);
		let hex = "#" + fullRGBtoHex(rColor, gColor, bColor);
		if (usedColors.has(hex) == false) {
			colorArr.push(String(i));
			colorArr.push(hex);
			usedColors.add(hex);
			i++;
		}
	}
	colorArr.push("#a9a9a9");
	return colorArr;
}

function updateLSTMRangeInput(val) { //for LSTM gridshape range HTML input
	let LSTM = document.querySelector("#LSTMRangeLabel");
	LSTM.innerHTML = val + " x " + val;
}

function updateFilteredPoints(crimeType, dateCommitted, timeCommitted) {
	filterPoints = new Array();
	times = []
	for (let i = 0; i < timeCommitted.length; i++) {
		times.push(timeCommitted[i].split('T')[1]);
	}
	dateCommitteds = new Set(dateCommitted);
	crimeTypes = new Set(crimeType);
	timeCommitteds = new Set(times);
	for (let i = 0; i < dataCrimes.features.length; i++) {
		let category = dataCrimes.features[i].properties.Category;
		let date = dataCrimes.features[i].properties.time;
		let time = dataCrimes.features[i].properties.time;
		if (filterExists(crimeTypes, category, 0) && filterExists(dateCommitteds, date, 1) && filterExists(timeCommitteds, time.split('T')[1], 1)) {
			filterPoints.push(dataCrimes.features[i]);
		}
	}
	return filterPoints;
}

function filterExists(filterArray, curParam, isTime) {
	return filterArray.has(curParam);
}


function findDBScanCluster(DBSCANdistance, features) {
	let DBScanClusterTimeSeries = {};
	//find the week that the crime occurred
	//find the cluster of the crime
	//append the crime's cluster of the crime's
	for (let i = 0; i < features.length; i++) {
		d = features[i].properties.time;
		let dayOfCrime = new Date(d);
		let dayDiff = dayOfCrime.getDate() - dayOfCrime.getDay();
		let weekOfCrime = new Date(dayOfCrime.setDate(dayDiff));
		weekOfCrime.setHours(0);
		weekOfCrime.setMinutes(0);
		weekOfCrime.setSeconds(0);
		weekOfCrime.setMilliseconds(0);
		let cluster = features[i].properties[DBSCANdistance];
		if (!(weekOfCrime.getTime() in DBScanClusterTimeSeries)) {
			DBScanClusterTimeSeries[weekOfCrime.getTime()] = 0;
		}
		DBScanClusterTimeSeries[weekOfCrime.getTime()]++;
	}
	DBScanClusterTimeSeriesArray = [];
	keys = Object.keys(DBScanClusterTimeSeries).sort();
	console.log(keys);
	last = keys.length - 1;
	while (keys[last] == "NaN") {
		last--;
	}
	date = new Date();
	lastDate = new Date();
	date.setTime(keys[0]);
	lastDate.setTime(keys[last]);
	while (date <= lastDate) {
		if (date.getTime() in DBScanClusterTimeSeries) {
			DBScanClusterTimeSeriesArray.push(DBScanClusterTimeSeries[date.getTime()]);
		} else {
			DBScanClusterTimeSeriesArray.push(0);
		}
		date.setDate(date.getDate() + 7);
	}
	return DBScanClusterTimeSeriesArray;
}

function appendDates() {
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

}

function appendTimes() {
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

}

function appendCrimeTypes(crimeType) {
	$("#crimeType").append("<input class = 'change' type = 'checkbox' id = 'crimeType-ALL' name = 'crimeType-ALL' font='sans-serif' checked></input>");
	$("#crimeType").append("<label for = 'crimeType-ALL'> Select All</label><br>");
	$("#crimeType").append("<input class = 'change' type = 'checkbox' id = 'crimeType-NONE' name = 'crimeType-NONE' font='sans-serif'></input>");
	$("#crimeType").append("<label for = 'crimeType-NONE'> Select None</label><br>");
	for (let i = 0; i < crimeType.length; i++) {
		$("#crimeType").append("<input class = 'change' type = 'checkbox' id = 'crimeType-" + crimeType[i] + "' name = 'crimeType-" + crimeType[i] + "' font='sans-serif' checked></input>");
		$("#crimeType").append("<label for = 'crimeType-" + crimeType[i] + "'> " + crimeType[i] + "</label><br>");
	}
}

function mouseOnPointsEvent(map, popup) {
	map.on('mouseenter', 'crimes', function (e) {
		// Change the cursor style as a UI indicator.
		map.getCanvas().style.cursor = 'pointer';
		//if(popup) popup.remove();
		let coordinates = e.features[0].geometry.coordinates.slice();
		let crimeDate = e.features[0].properties.time;
		let crimeMonth = crimeDate.slice(5, 7);
		let crimeDay = crimeDate.slice(8, 10);
		let crimeYear = crimeDate.slice(0, 4);
		let crimeTime = crimeDate.slice(11, 16);
		let description = "<b>Type: " + e.features[0].properties.Category + "</b><br>Date: "
			+ crimeMonth + "-" + crimeDay + "-" + crimeYear + "<br>"
			+ "Time: " + crimeTime + ":00 PST<br>"
		// + "DBScan Cluster: " + e.features[0].properties[DBSCANdistance] + "<br>"
		// + "LSTM Cluster: " + e.features[0].properties['lstmCluster'] + "<br>";

		if (dbPredict.length > 0) {
			dbPredictData = $.parseJSON(dbPredict);
			//dbPredict = JSON.parse(dbPredict);
			let pred = dbPredictData[0][e.features[0].properties[DBSCANdistance]];
			if (e.features[0].properties[DBSCANdistance] == -1) pred = 0;
			description += "Predicted # of Crimes: " + pred + "<br>";
		}

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

	map.on('mouseleave', 'crimes', function () {
		map.getCanvas().style.cursor = '';
		popup.remove();
	});
}

function removeExistingClusterLayers(map) {
	//REMOVE ANY CURRENT  CLUSTER LAYERS
	for (let i = 0; i < 10000; i++) {
		let currClusterID = 'cluster' + i;
		if (map.getLayer(currClusterID)) {
			// Remove map layer & source.
			map.removeLayer(currClusterID).removeSource(currClusterID);
		}
		if (typeof map.getLayer(currClusterID + '_') !== 'undefined') {
			map.removeLayer(currClusterID + '_').removeSource(currClusterID + '_');
		}
	}

}

function addClusterLayer(map, id, points, color) {
	map.addLayer({
		"id": id,
		"type": "fill",
		"source": {
			"type": "geojson",
			"data": {
				"type": "Feature",
				"geometry": {
					"type": "Polygon",
					"coordinates": [points]
				}
			}
		},
		"layout": {},
		"paint": {
			"fill-color": color,
			"fill-opacity": 0.4
		}
	});
}

function changeFunctionsHookUp(map, dateCommitted, timeCommitted, crimeType) {
	$(".change").change(function () {
		let numDaysOfWeekChecked = 7
		let numTimesOfDayChecked = 5;
		if ($(this).prop("checked")) {
			if ($(this).prop("name").slice(0, 3) == "day") {
				if ($(this).prop("name").slice(4) == "ALL") {
					dateCommitted = ["none"];
					days.forEach(function (value) {
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
				else if ($(this).prop("name").slice(4) == "NONE") {
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
					if (numDaysOfWeekChecked == 1 || numDaysOfWeekChecked == 7) {
						if (numDaysOfWeekChecked == 1) {
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

					if ($(this).prop("name").slice(4) == "Mondays") {
						days.forEach(function (value) {
							let curDate = new Date(value);
							if (curDate.getDay() == 1) {
								dateCommitted.push(value);
							}
						});
					}
					if ($(this).prop("name").slice(4) == "Tuesdays") {
						days.forEach(function (value) {
							let curDate = new Date(value);
							if (curDate.getDay() == 2) dateCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Wednesdays") {
						days.forEach(function (value) {
							let curDate = new Date(value);
							if (curDate.getDay() == 3) dateCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Thursdays") {
						days.forEach(function (value) {
							let curDate = new Date(value);
							if (curDate.getDay() == 4) dateCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Fridays") {
						days.forEach(function (value) {
							let curDate = new Date(value);
							if (curDate.getDay() == 5) dateCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Saturdays") {
						days.forEach(function (value) {
							let curDate = new Date(value);
							if (curDate.getDay() == 6) dateCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Sundays") {
						days.forEach(function (value) {
							let curDate = new Date(value);
							if (curDate.getDay() == 0) dateCommitted.push(value);
						});
					}

					for (let i = 0; i < dateCommitted.length; i++) {
						let curDate = new Date(dateCommitted[i]);
						console.log(curDate);
					}
				}
			}

			else if ($(this).prop("name").slice(0, 3) == "tod") {
				if ($(this).prop("name").slice(4) == "ALL") {
					numTimesOfDayChecked = 5;
					dateCommitted = ["none"];
					days.forEach(function (value) {
						dateCommitted.push(value.toString());
					});
					$("#timeOfDay input[name='tod-ALL']:checkbox").prop('checked', true);
					$("#timeOfDay input[name='tod-NONE']:checkbox").prop('checked', false);
					$("#timeOfDay input[name='tod-Morning']:checkbox").prop('checked', true);
					$("#timeOfDay input[name='tod-Noon']:checkbox").prop('checked', true);
					$("#timeOfDay input[name='tod-Afternoon']:checkbox").prop('checked', true);
					$("#timeOfDay input[name='tod-Evening']:checkbox").prop('checked', true);
					$("#timeOfDay input[name='tod-Night']:checkbox").prop('checked', true);
					for (let i = 0; i < dateCommitted.length; i++) {
						let curTime = new Date(dateCommitted[i]);
					}
				}
				if ($(this).prop("name").slice(4) == "NONE") {
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
					if (numTimesOfDayChecked == 1) {
						timeCommitted = ["none"];
						$("#timeOfDay input[name='tod-NONE']:checkbox").prop('checked', false);
					}
					if (numTimesOfDayChecked == 5) {
						$("#timeOfDay input[name='tod-ALL']:checkbox").prop('checked', true);
						$("#timeOfDay input[name='tod-NONE']:checkbox").prop('checked', false);
					}
					if ($(this).prop("name").slice(4) == "Morning") {
						days.forEach(function (value) {
							let curTime = new Date(value);
							if (curTime.getHours() >= 5 && curTime.getHours() <= 10) timeCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Noon") {
						days.forEach(function (value) {
							let curTime = new Date(value);
							if (curTime.getHours() >= 11 && curTime.getHours() <= 14) timeCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Afternoon") {
						days.forEach(function (value) {
							let curTime = new Date(value);
							if (curTime.getHours() >= 15 && curTime.getHours() <= 18) timeCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Evening") {
						days.forEach(function (value) {
							let curTime = new Date(value);
							if (curTime.getHours() >= 19 && curTime.getHours() <= 23) timeCommitted.push(value);
						});
					}
					if ($(this).prop("name").slice(4) == "Night") {
						days.forEach(function (value) {
							let curTime = new Date(value);
							if (curTime.getHours() >= 0 && curTime.getHours() <= 4) timeCommitted.push(value);
						});
					}
				}
			}

			else if ($(this).prop("name").slice(0, 9) == "crimeType") {
				if ($(this).prop("name").slice(10) == "ALL") {
					crimeType = ["none"];
					ct.forEach(function (value) {
						crimeType.push(value);
					});
					$('#crimeType input:checkbox').prop('checked', true);
					$("#crimeType input[name='crimeType-NONE']:checkbox").prop('checked', false);
				}
				else if ($(this).prop("name").slice(10) == "NONE") {
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
				for(let i = 0; i < dateCommitted.length; i++) {
					if($(this).prop("name").slice(4) == dateCommitted[i]) dateCommitted.splice(i,1);
				}
				$("#dates input[name='day-ALL']:checkbox").prop('checked', false);
			}*/

			if ($(this).prop("name").slice(0, 9) == "crimeType") {
				//console.log($(this).prop("name"));
				for (let i = crimeType.length - 1; i >= 0; i--) {
					if ($(this).prop("name").slice(10) == crimeType[i]) crimeType.splice(i, 1);
				}
				$("#crimeType input[name='crimeType-ALL']:checkbox").prop('checked', false);
			}
			// if a day was unchecked delete it from dates array
			// if a type was unchecked delete it from types array
			else if ($(this).prop("name").slice(0, 3) == "tod") {
				numTimesOfDayChecked -= 1;
				$("#timeOfDay input[name='tod-ALL']:checkbox").prop("checked", false);
				if (numTimesOfDayChecked == 0) {
					$("#timeOfDay input[name='tod-NONE']:checkbox").prop('checked', true);
				}
				if ($(this).prop("name").slice(4) == "Morning") {
					for (let i = timeCommitted.length - 1; i >= 0; i--) {
						let curTime = new Date(timeCommitted[i]);
						if (curTime.getHours() >= morningStart && curTime.getHours() <= morningEnd) timeCommitted.splice(i, 1);
					}
				}
				if ($(this).prop("name").slice(4) == "Noon") {
					for (let i = timeCommitted.length - 1; i >= 0; i--) {
						let curTime = new Date(timeCommitted[i]);
						if (curTime.getHours() >= noonStart && curTime.getHours() <= noonEnd) timeCommitted.splice(i, 1);
					}
				}
				if ($(this).prop("name").slice(4) == "Afternoon") {
					for (let i = timeCommitted.length - 1; i >= 0; i--) {
						let curTime = new Date(timeCommitted[i]);
						if (curTime.getHours() >= afternoonStart && curTime.getHours() <= afternoonEnd) timeCommitted.splice(i, 1);
					}
				}
				if ($(this).prop("name").slice(4) == "Evening") {
					for (let i = timeCommitted.length - 1; i >= 0; i--) {
						let curTime = new Date(timeCommitted[i]);
						if (curTime.getHours() >= eveningStart && curTime.getHours() <= eveningEnd) timeCommitted.splice(i, 1);
					}
				}
				if ($(this).prop("name").slice(4) == "Night") {
					for (let i = timeCommitted.length - 1; i >= 0; i--) {
						let curTime = new Date(timeCommitted[i]);
						if (curTime.getHours() >= nightStart && curTime.getHours() <= nightEnd) timeCommitted.splice(i, 1);
					}
				}
			}
			else {
				$("#dates input[name='day-ALL']:checkbox").prop('checked', false);
				numDaysOfWeekChecked -= 1;
				if (numDaysOfWeekChecked == 0) {
					$("#dates input[name='day-NONE']:checkbox").prop('checked', true);
				}
				if ($(this).prop("name").slice(4) == "Mondays") {
					for (let i = dateCommitted.length - 1; i >= 0; i--) {
						let curDate = new Date(dateCommitted[i]);
						if (curDate.getDay() == 1) {
							dateCommitted.splice(i, 1);
						}
					}
				}
				else if ($(this).prop("name").slice(4) == "Tuesdays") {
					for (let i = dateCommitted.length - 1; i >= 0; i--) {
						let curDate = new Date(dateCommitted[i]);
						if (curDate.getDay() == 2) dateCommitted.splice(i, 1);
					}
				}
				else if ($(this).prop("name").slice(4) == "Wednesdays") {
					for (let i = dateCommitted.length - 1; i >= 0; i--) {
						let curDate = new Date(dateCommitted[i]);
						if (curDate.getDay() == 3) dateCommitted.splice(i, 1);
					}
				}
				else if ($(this).prop("name").slice(4) == "Thursdays") {
					for (let i = dateCommitted.length - 1; i >= 0; i--) {
						let curDate = new Date(dateCommitted[i]);
						if (curDate.getDay() == 4) dateCommitted.splice(i, 1);
					}
				}
				else if ($(this).prop("name").slice(4) == "Fridays") {
					for (let i = dateCommitted.length - 1; i >= 0; i--) {
						let curDate = new Date(dateCommitted[i]);
						if (curDate.getDay() == 5) dateCommitted.splice(i, 1);
					}
				}
				else if ($(this).prop("name").slice(4) == "Saturdays") {
					for (let i = dateCommitted.length - 1; i >= 0; i--) {
						let curDate = new Date(dateCommitted[i]);
						if (curDate.getDay() == 6) dateCommitted.splice(i, 1);
					}
				}
				else if ($(this).prop("name").slice(4) == "Sundays") {
					for (let i = dateCommitted.length - 1; i >= 0; i--) {
						let curDate = new Date(dateCommitted[i]);
						if (curDate.getDay() == 0) dateCommitted.splice(i, 1);

					}
				}
			}
		}
		// modify the next line to also work dates
		map.setFilter("crimes", ["all", ["match", ["get", "Category"], crimeType, true, false], ["match", ["get", "time"], timeCommitted, true, false], ["match", ["get", "time"], dateCommitted, true, false]]);
		filterPoints = updateFilteredPoints(crimeType, dateCommitted, timeCommitted);
	});
}

function submitFunctionHookUp(map, dateCommitted, timeCommitted, crimeType) {
	$("#submit").click(function () {
		console.log('submit hit...');
		dateCommitted = ["none"];
		dateFrom = document.getElementById("date-from").value;
		dateTo = document.getElementById("date-to").value;
		//convert dateFrom and dateTo to python ordinal dates
		for (let i = Date.parse(dateFrom) + 8.64e+7; i <= Date.parse(dateTo) + 8.64e+7; i += 8.64e+7) {
			let i_ = new Date(i);
			curDate = i_.getDate();
			let cDate = '' + curDate;
			if (curDate < 10) cDate = "0" + curDate.toString();
			curMonth = i_.getMonth() + 1;
			let cMonth = curMonth.toString();
			if (curMonth < 10) cMonth = "0" + curMonth.toString();
			curYear = i_.getFullYear();
			let cYear = curYear.toString();
			for (let j = 0; j <= 24; j++) {
				let cHour = "";
				if (j <= 9) cHour = "T0" + j.toString() + ":00:00Z";
				else cHour = "T" + j.toString() + ":00:00Z";
				dateCommitted.push(cYear + "-" + cMonth + "-" + cDate + cHour);
			}
		}

		$("#dates input[name='day-NONE']:checkbox").prop('checked', false);

		map.setFilter("crimes", ["all", ["match", ["get", "Category"], crimeType, true, false], ["match", ["get", "time"], dateCommitted, true, false], ["match", ["get", "time"], timeCommitted, true, false]]);
		filterPoints = updateFilteredPoints(crimeType, dateCommitted, timeCommitted);
		//console.log("DATE RANGE FILTER: DONE");
	});
}

function addClusterLayersFromBoundaries(data, map){
    for (let i = 0; i < data[0].length; ++i) {
        let points = data[0][i]
        // console.log(points)
        let clusterID = "cluster" + i;
        if (data[0][i].length >= 7) {
            let path_idx = new Map();
            const start_point = data[0][i][0]
            for (let j = 0; j < data[0][i].length; ++j) {
                // javascript set doesn't compare the actual values of an array
                // therefore, `set.add([1,2]); set.add([1,2]);` results in a set with two elements
                // therefore, here we use `x * 10000 + y` as a simple hash function to represent the pair [x,y]
                let hash = data[0][i][j][0] * 10000 + data[0][i][j][1]
                if (path_idx.has(hash)) {
                    addClusterLayer(map, clusterID + '_', data[0][i].slice(path_idx.get(hash), j), colorArr[2 * i + 3])
                    data[0][i].slice(path_idx.get(hash), j)
                    points = data[0][i].slice(0, path_idx.get(hash)).concat(data[0][i].slice(j));
                    break;
                }
                path_idx.set(hash, j);
            }
        }
        map.addLayer({
                     "id": clusterID,
                     "type": "fill",
                     "source": {
                     "type": "geojson",
                     "data": {
                     "type": "Feature",
                     "geometry": {
                     "type": "Polygon",
                     "coordinates": [points]
                     }
                     }
                     },
                     "layout": {},
                     "paint": {
                     "fill-color": colorArr[2 * i + 3],
                     "fill-opacity": 0.4
                     }
                    });
    }
}

function clusterButtonHookUp(map, dateCommitted, timeCommitted, crimeType){
	$(".cluster-button").classList.remove('disabled');

	$(".cluster-button").click(function () {
		removeExistingClusterLayers(map);

		const grid_x = document.getElementById("grid-x").value;
		const grid_y = document.getElementById("grid-y").value;
		const threshold = document.getElementById("threshold").value;

		x = updateFilteredPoints(crimeType, dateCommitted, timeCommitted)

		$.ajax({
			type: "POST",
			url: "http://localhost:8000/crimePred/heterogeneous-cluster",
			data: JSON.stringify({ 'features': x, 'gridShape': "(" + grid_x + "," + grid_y + ")", 'threshold': threshold }),
			success: function (data) {
				data = JSON.parse(data);
				addClusterLayersFromBoundaries(data, map);
			}
		});
	});
}

function predictButtonHookUp(){
	$('.predict-button').click(function () {
		x = updateFilteredPoints(crimeType, dateCommitted, timeCommitted)
		$.ajax({
			type: "POST",
			url: "http://localhost:8000/crimePred/cluster-predict",
			data: JSON.stringify({
				'features': x,
				'periodsAhead': $('#periods-ahead').val(),
				'method': $('input[name=prediction-method]:checked')[0].value,
				'gridshape-x': $('#grid-x').val(),
				'gridshape-y': $('#grid-y').val(),
				'threshold': $('#threshold').val()
			}),
			success: function (data3) {
				dbPredict = data3;
				console.log("PREDICT: " + dbPredict);
			}
		});
	});
}

function loadmap() {
	mapboxgl.accessToken = 'pk.eyJ1Ijoia2F0aGxlZW54dWUiLCJhIjoiY2pyOXU5Z3JlMGxiNzQ5cGgxZmo5MWhzeiJ9.xyOwT8LWfjpOlEvPF2Iy7Q';
	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/light-v9',
		center: [-118.2851, 34.026],
		zoom: 14
	});

	let ct = new Set();
	let days = new Set();

	for (let i = 0; i < dataCrimes.features.length; i++) {
		ct.add(dataCrimes.features[i].properties.Category);
		days.add(dataCrimes.features[i].properties.time.toString());
	}

	let crimeType = new Array();

	ct.forEach(function (value) {
		crimeType.push(value);
	});

	crimeType.sort();

	let dateCommitted = new Array();
	let timeCommitted = new Array();

	days.forEach(function (value) {
		dateCommitted.push(value);
		timeCommitted.push(value);
	});

	appendDates();
	appendTimes();
	appendCrimeTypes(crimeType);

	let colorArr = new Array();
	let DBSCANdistance = "0cluster";
	colorArr = colors(DBSCANdistance);

	map.on('load', function () {
		map.addSource("dataCrimes", {
			"type": "geojson",
			"data": dataCrimes
		});

		//MAP LAYER: ALL CRIMES
		map.addLayer({
			"id": "crimes",
			"type": "circle",
			"source": "dataCrimes",
			"paint": {
				"circle-radius": {
					"base": 3.25,
					"stops": [[12, 3.5], [22, 180]]
				},
				"circle-color": colorArr,
				"circle-stroke-width": 1,
				"circle-stroke-color": "#ffffff"
			}
		});

		let popup = new mapboxgl.Popup({
			closeButton: false,
			closeOnClick: false
		});

		mouseOnPointsEvent(map, popup);

		map.setFilter("crimes", ["all"]);
	});

	changeFunctionsHookUp(map, dateCommitted, timeCommitted, crimeType);

	submitFunctionHookUp(map, dateCommitted, timeCommitted, crimeType);

	clusterButtonHookUp(map, dataCrimes, timeCommitted, crimeType);
}

function handleFileSelect(evt) {
	let files = evt.target.files; // FileList object

	// files is a FileList of File objects. List some properties.
	for (let i = 0, f; f = files[i]; i++) {
		let reader = new FileReader();

		// Closure to capture the file information.
		reader.onload = (function (theFile) {
			return function (e) {
				dataCrimes = e.target.result;
				try {
					dataCrimes = JSON.parse(dataCrimes);
				} catch (ex) {
					alert('ex when trying to parse json = ' + ex);
				}
				loadmap();
			}
		})(f);
		reader.readAsText(f);
	}
}

document.getElementsByClassName('files')[0].addEventListener('change', handleFileSelect, false);

// $(document).ready(function () {
// 	$("#DBPredict").click(function () {
// 		console.log("dbPredict selected");
// 		//if(dbPredict.length == 0) do nothing
// 		x = updateFilteredPoints(crimeType, dateCommitted, timeCommitted)
// 		/*if(dbPredict.length > 0)  {
// 			for(let i = 0; i < x.length; i++) {
// 				//dbPredict[x[i].properties[DBSCANdistance]] //# crimes predicted for this cluster
// 			}
// 		}*/

// 	});




// 	$("#DBSCANsubmit").click(function () {
// 		//console.log(filterPoints.length);
// 		/*for(let i = 0; i < filterPoints.length; i++) {

// 			console.log(filterPoints[i]);
// 		}*/
// 		let allFilters = {
// 			crimeType,
// 			dateCommitted,
// 			timeCommitted
// 		};

// 		//let csrftoken = getCookie('csrftoken');
// 		//
// 		//console.log(allFilters)
// 		x = updateFilteredPoints(crimeType, dateCommitted, timeCommitted)
// 		$.ajax({
// 			type: "POST",
// 			url: "http://localhost:8000/dbscan",
// 			data: JSON.stringify({ 'features': x, 'dist': document.getElementById("DBScanInput").value }),
// 			success: function (data) {
// 				data = JSON.parse(data);
// 				data2 = [];
// 				for (let key = 0; key < x.length; key++) {
// 					data2[key] = {};
// 					data2[key]['geometry'] = data['geometry'][key];
// 					data2[key]['type'] = data['type'][key];
// 					data2[key]['properties'] = data['properties'][key];
// 					//console.log(dataCrimes);
// 				}
// 				dataCrimes['features'] = data2;
// 				map.getSource('dataCrimes').setData(dataCrimes);
// 				timeseries = findDBScanCluster(DBSCANdistance, x);
// 				timeseriesToPredict = timeseries;
// 				console.log("DBSCANNED " + timeseries);

// 				//console.log(data2);
// 				//console.log(dataCrimes);
// 			}
// 		});

// 		/*$.ajaxSetup({
// 		    beforeSend: function(xhr, settings) {
// 		        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
// 		            xhr.setRequestHeader("X-CSRFToken", csrftoken);
// 		        }
// 		    }
// 		});*/

// 		clusters = [];
// 		let fileName = document.getElementById("DBScanInput").value + "miles.txt";
// 		/*const fs = require('fs');
// 		fs.readFile(fileName, function(text){
//   			clusters = text.split("\n") //gives me array assigning each crime to a cluster
// 		});*/
// 		let curDistance = parseFloat(document.getElementById("DBScanInput").value);
// 		//console.log(curDistance);
// 		if (curDistance == 0 || curDistance == 1) DBSCANdistance = Math.trunc(curDistance).toString() + "cluster";
// 		else if (curDistance == 0.1 || curDistance == 0.2 || curDistance == 0.3 || curDistance == 0.4 || curDistance == 0.5
// 			|| curDistance == 0.6 || curDistance == 0.7 || curDistance == 0.8 || curDistance == 0.9) {
// 			console.log(curDistance);
// 			let oneDecimal = Math.round(curDistance * 10) / 10;
// 			DBSCANdistance = oneDecimal.toString() + "cluster";
// 		}
// 		else DBSCANdistance = (Math.round(curDistance * 100) / 100).toFixed(2) + "cluster";
// 		//console.log(DBSCANdistance);
// 		let colorArr = colors(DBSCANdistance);
// 		map.setPaintProperty("crimes", "circle-color", colorArr);

// 	});



// function LSTMtimeseries(clusterOfEachPoint, features) {
// 	let lstmClusterTimeSeries = {};

// 	for (let i = 0; i < features.length; i++) {
// 		_time = features[i].properties.time;
// 		let dayOfCrime = new Date(_time);
// 		let dayDiff = dayOfCrime.getDate() - dayOfCrime.getDay();
// 		let weekOfCrime = new Date(dayOfCrime.setDate(dayDiff));
// 		weekOfCrime.setHours(0);
// 		weekOfCrime.setMinutes(0);
// 		weekOfCrime.setSeconds(0);
// 		weekOfCrime.setMilliseconds(0);
// 		let cluster = clusterOfEachPoint[i];
// 		if (!(weekOfCrime.getTime() in lstmClusterTimeSeries)) {
// 			lstmClusterTimeSeries[weekOfCrime.getTime()] = 0;
// 		}
// 		lstmClusterTimeSeries[weekOfCrime.getTime()]++;
// 	}

// 	keys = Object.keys(lstmClusterTimeSeries).sort();
// 	last = keys.length - 1;
// 	while (keys[last] == "NaN") {
// 		last--;
// 	}
// 	date = new Date();
// 	lastDate = new Date();
// 	date.setTime(keys[0]);
// 	lastDate.setTime(keys[last]);
// 	lstmClusterTimeSeriesArray = [];
// 	while (date <= lastDate) {
// 		if (date.getTime() in DBScanClusterTimeSeries) {
// 			lstmClusterTimeSeriesArray.push(lstmClusterTimeSeries[date.getTime()]);
// 		} else {
// 			lstmClusterTimeSeriesArray.push(0);
// 		}
// 		date.setDate(date.getDate() + 7);
// 	}
// 	console.log(lstmClusterTimeSeriesArray);
// 	return lstmClusterTimeSeriesArray;
// }

// function isInCluster(clusterBoundaries, coordLon, coordLat) {
// 	if (clusterBoundaries.length < 3) return false;
// 	let pointExtreme = [coordLon, 100];
// 	let count = 0;
// 	for (let i = 0; i < clusterBoundaries.length; i++) {
// 		if (segmentsIntersect(clusterBoundaries[i][0], clusterBoundaries[i][1],
// 			clusterBoundaries[i][2], clusterBoundaries[i][3],
// 			coordLon, coordLat,
// 			pointExtreme[0], pointExtreme[1])) {
// 			count++;
// 		}
// 	}
// 	return count % 2 == 1;
// }

// function segmentsIntersect(a, b, c, d, p, q, r, s) {
// 	let det, gamma, lambda;
// 	det = (c - a) * (s - q) - (r - p) * (d - b);
// 	if (det === 0) {
// 		return false;
// 	} else {
// 		lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
// 		gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
// 		return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
// 	}
// }

// function onSegment(pLon, pLat, qLon, qLat, rLon, rLat) {
// 	if (qLat <= max(pLat, rLat) && qLat >= min(pLat, rLat) &&
// 		qLon <= max(pLon, rLon) && qLon >= min(pLon, rLon)) {
// 		return true;
// 	}
// 	return false;
// }

// function intersects(firstLon, firstLat, secLon, secLat, pLon, pLat, exLon, exLat) {
// 	let o1 = orientation(firstLon, firstLat, secLon, secLat, pLon, pLat);
// 	let o2 = orientation(firstLon, firstLat, secLon, secLat, exLon, exLat);
// 	let o3 = orientation(pLon, pLat, exLon, exLat, firstLon, firstLat);
// 	let o4 = orientation(pLon, pLat, exLon, exLat, secLon, secLat);

// 	if (o1 != o2 && o3 != o4) return true;

// 	if (o1 == 0 && onSegment(firstLon, firstLat, pLon, pLat, secLon, secLat)) return true;

// 	if (o2 == 0 && onSegment(firstLon, firstLat, exLon, exLat, secLon, secLat)) return true;

// 	if (o3 == 0 && onSegment(pLon, pLat, firstLon, firstLat, exLon, exLat)) return true;

// 	if (o4 == 0 && onSegment(pLon, pLat, secLon, secLat, exLon, exLat)) return true;

// 	return false;
// }

// function orientation(firstLon, firstLat, secLon, secLat, thirdLon, thirdLat) {
// 	let val = (secLon - firstLon) * (thirdLat - secLat) -
// 		(secLat - firstLat) * (thirdLon - secLon);
// 	if (val == 0) return 0;
// 	return (val > 0) ? 1 : 2;
// }

// function LSTMpointsInEachCluster(clusterBoundaries, features) {
// 	//clusterBoundaries is array of clusters, clusterBoundaries[j] is cluster j of the array
// 	//returns an array that gives the points in each LSTM cluster
// 	let pointsInEachCluster = new Array(clusterBoundaries.length);
// 	let numPointsInAnyCluster = 0;
// 	for (let j = 0; j < clusterBoundaries.length; j++) {
// 		let curCluster = new Array();
// 		for (let i = 0; i < features.length; i++) {
// 			if (isInCluster(clusterBoundaries[j], parseFloat(features[i].geometry.coordinates[0]), parseFloat(features[i].geometry.coordinates[1]))) {
// 				curCluster.push(features[i]);
// 				numPointsInAnyCluster++;
// 			}
// 			pointsInEachCluster[j] = curCluster;
// 		}
// 	}
// 	return pointsInEachCluster;
// }

// function LSTMcontains(pointsInEachCluster, curFeature) {
// 	for (let i = 0; i < pointsInEachCluster.length; i++) {
// 		curClustFeature = pointsInEachCluster[i];
// 		//console.log(curClustFeature.geometry);
// 		if (curClustFeature.geometry.coordinates[0] == curFeature.geometry.coordinates[0] && curClustFeature.geometry.coordinates[1] == curFeature.geometry.coordinates[1]
// 			&& curClustFeature.properties.time == curFeature.properties.time
// 			&& curClustFeature.properties.Category == curFeature.properties.Category) {
// 			return true;
// 		}
// 	}
// 	return false;
// }

// function LSTMclusterOfEachPoint(pointsInEachCluster, features) {
// 	let clusterOfEachPoint = new Array(features.length).fill(-1);
// 	//console.log("curCluster: " + pointsInEachCluster[0]);
// 	for (let i = 0; i < features.length; i++) {
// 		for (let j = 0; j < pointsInEachCluster.length; j++) {
// 			let curCluster = new Array();
// 			curCluster = pointsInEachCluster[j];

// 			if (LSTMcontains(curCluster, features[i])) {
// 				clusterOfEachPoint[i] = j;
// 				break;
// 			}
// 		}
// 	}
// 	return clusterOfEachPoint;
// }

// function getCookie(name) {
// 	let cookieValue = null;
// 	if (document.cookie && document.cookie !== '') {
// 		let cookies = document.cookie.split(';');
// 		for (let i = 0; i < cookies.length; i++) {
// 			let cookie = cookies[i].trim();
// 			// Does this cookie string begin with the name we want?
// 			if (cookie.substring(0, name.length + 1) === (name + '=')) {
// 				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
// 				break;
// 			}
// 		}
// 	}
// 	return cookieValue;
// }

// function csrfSafeMethod(method) {
// 	// these HTTP methods do not require CSRF protection
// 	return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
// }





