mapboxgl.accessToken =
    'pk.eyJ1Ijoia2F0aGxlZW54dWUiLCJhIjoiY2pyOXU5Z3JlMGxiNzQ5cGgxZmo5MWhzeiJ9.xyOwT8LWfjpOlEvPF2Iy7Q';
let dataCrimes;
let ct = new Set();
let dates = new Set();
let times = new Set();
let dateCommitted = new Set();
let timeCommitted = new Set();
let ctCommitted = new Set();
let colorArr = new Array();
let approximateCentroidsForClusters = new Array();
let clusters;
let realCrimes;
// let dbPredict = [];
// let timeseriesToPredict = [];

function rgbToHex(color) {
    let hex = Number(color).toString(16);
    if (hex.length < 2) {
        hex = '0' + hex;
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
    colorArr = new Array();
    let usedColors = new Set();

    colorArr.push('match');

    let specifyClusterDistance = new Array();
    specifyClusterDistance.push('get');
    specifyClusterDistance.push(String(DBSCANdistance));

    colorArr.push(specifyClusterDistance);
    colorArr.push('-1');
    colorArr.push('#000000');
    colorArr.push('0');
    colorArr.push('#ff8080');

    usedColors.add('#000000');
    usedColors.add('#ff8080');
    usedColors.add('#a9a9a9');

    let i = 1;
    while (colorArr.length < 4096) {
        let rColor = Math.floor(Math.random() * 256);
        let gColor = Math.floor(Math.random() * 256);
        let bColor = Math.floor(Math.random() * 256);
        let hex = '#' + fullRGBtoHex(rColor, gColor, bColor);
        if (usedColors.has(hex) == false) {
            colorArr.push(String(i));
            colorArr.push(hex);
            usedColors.add(hex);
            i++;
        }
    }
    colorArr.push('#a9a9a9');
    return colorArr;
}

function filterExists(filterArray, curParam) {
    return filterArray.has(curParam);
}

function updateFilteredPoints() {
    filterPoints = new Array();
    for (let i = 0; i < dataCrimes.length; i++) {
        let category = dataCrimes[i]['Category'];
        let date = dataCrimes[i]['Date'];
        let time = dataCrimes[i]['Time'];
        if (
            filterExists(ctCommitted, category) &&
            filterExists(dateCommitted, date) &&
            filterExists(timeCommitted, time)
        ) {
            filterPoints.push(dataCrimes[i]);
        }
    }
    return filterPoints;
}

function appendDates() {
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id = 'day-ALL' name = 'day-ALL' font='sans-serif' checked></input>"
    );
    $('#dates').append("<label for = 'day-ALL'>Select All</label><br>");
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id = 'day-NONE' name = 'day-NONE' font='sans-serif'></input>"
    );
    $('#dates').append("<label for = 'day-NONE'>Select None</label><br>");
    $('#dates').append('<br><b>Filter by Date Range</b><br>');
    $('#dates').append(
        "<input data-dependent-validation='{'from': 'date-to', 'prop': 'max'}' class = 'change' type = 'date' id='date-from' name='date-from' placeholder='from'></input>"
    );
    $('#dates').append(
        "<input data-dependent-validation='{'from': 'date-from', 'prop': 'min'}' class = 'change' type = 'date' id='date-to' name='date-to' placeholder='to'></input>"
    );
    $('#dates').append(
        "<input class='change' type='submit' id='submit' name='submit' /><br>"
    );
    $('#dates').append('<br><b>Filter by Day of Week</b><br>');
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id='day-Mondays' name='day-Mondays' font='sans-serif' checked></input>"
    );
    $('#dates').append("<label for = 'day-Mondays'>Mondays</label><br>");
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id='day-Tuesdays' name='day-Tuesdays' font='sans-serif' checked></input>"
    );
    $('#dates').append("<label for = 'day-Tuesdays'>Tuesdays</label><br>");
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id='day-Wednesdays' name='day-Wednesdays' font='sans-serif' checked></input>"
    );
    $('#dates').append("<label for = 'day-Wednesdays'>Wednesdays</label><br>");
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id='day-Thursdays' name='day-Thursdays' font='sans-serif' checked></input>"
    );
    $('#dates').append("<label for = 'day-Thursdays'>Thursdays</label><br>");
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id='day-Fridays' name='day-Fridays' font='sans-serif' checked></input>"
    );
    $('#dates').append("<label for = 'day-Fridays'>Fridays</label><br>");
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id='day-Saturdays' name='day-Saturdays' font='sans-serif' checked></input>"
    );
    $('#dates').append("<label for = 'day-Saturdays'>Saturdays</label><br>");
    $('#dates').append(
        "<input class = 'change' type = 'checkbox' id='day-Sundays' name='day-Sundays' font='sans-serif' checked></input>"
    );
    $('#dates').append("<label for = 'day-Sundays'>Sundays</label>");
}

function appendTimes() {
    $('#timeOfDay').append(
        "<input class = 'change' type = 'checkbox' id='tod-ALL' name='tod-ALL' font='sans-serif' checked></input>"
    );
    $('#timeOfDay').append("<label for = 'tod-ALL'>Select All</label><br>");
    $('#timeOfDay').append(
        "<input class = 'change' type = 'checkbox' id='tod-NONE' name='tod-NONE' font='sans-serif'></input>"
    );
    $('#timeOfDay').append(
        "<label for = 'tod-Morning'>Select None</label><br>"
    );
    $('#timeOfDay').append(
        "<input class = 'change' type = 'checkbox' id='tod-Morning' name='tod-Morning' font='sans-serif' checked></input>"
    );
    $('#timeOfDay').append(
        "<label for = 'tod-Morning'>Morning (5 am to 10 am)</label><br>"
    );
    $('#timeOfDay').append(
        "<input class = 'change' type = 'checkbox' id='tod-Noon' name='tod-Noon' font='sans-serif' checked></input>"
    );
    $('#timeOfDay').append(
        "<label for = 'tod-Noon'>Noon (11 am to 2 pm)</label><br>"
    );
    $('#timeOfDay').append(
        "<input class = 'change' type = 'checkbox' id='tod-Afternoon' name='tod-Afternoon' font='sans-serif' checked></input>"
    );
    $('#timeOfDay').append(
        "<label for = 'tod-Afternoon'>Afternoon (3 pm to 6 pm)</label><br>"
    );
    $('#timeOfDay').append(
        "<input class = 'change' type = 'checkbox' id='tod-Evening' name='tod-Evening' font='sans-serif' checked></input>"
    );
    $('#timeOfDay').append(
        "<label for = 'tod-Evening'>Evening (7 pm to 11 pm)</label><br>"
    );
    $('#timeOfDay').append(
        "<input class = 'change' type = 'checkbox' id='tod-Night' name='tod-Night' font='sans-serif' checked></input>"
    );
    $('#timeOfDay').append(
        "<label for = 'tod-Night'>Night (12 am to 4 am)</label><br>"
    );
}

function appendCrimeTypes() {
    $('#crimeType').append(
        "<input class = 'change' type = 'checkbox' id = 'crimeType-ALL' name = 'crimeType-ALL' font='sans-serif' checked></input>"
    );
    $('#crimeType').append(
        "<label for = 'crimeType-ALL'> Select All</label><br>"
    );
    $('#crimeType').append(
        "<input class = 'change' type = 'checkbox' id = 'crimeType-NONE' name = 'crimeType-NONE' font='sans-serif'></input>"
    );
    $('#crimeType').append(
        "<label for = 'crimeType-NONE'> Select None</label><br>"
    );
    ct.forEach((v1, v2, set) => {
        $('#crimeType').append(
            "<input class = 'change' type = 'checkbox' id = 'crimeType-" +
            v1 +
            "' name = 'crimeType-" +
            v1 +
            "' font='sans-serif' checked></input>"
        );
        $('#crimeType').append(
            "<label for = 'crimeType-" + v1 + "'> " + v1 + '</label><br>'
        );
    });
}

function mouseOnPointsEvent(popup, map) {
    map.on('mouseenter', 'crimes', function (e) {
        const {
            Category,
            Date,
            Latitude,
            Longitude
        } = e.features[0].properties;
        let description = `Type: ${Category}<br/>
							Date: ${Date} <br/>
							Latitude: ${Latitude} <br/>
							Longitude: ${Longitude} <br/>
							${e.features.length} incident(s) happened here.`;
        // + "DBScan Cluster: " + e.features[0].properties[DBSCANdistance] + "<br>"
        // + "LSTM Cluster: " + e.features[0].properties['lstmCluster'] + "<br>";

        // if (dbPredict.length > 0) {
        // 	dbPredictData = $.parseJSON(dbPredict);
        // 	//dbPredict = JSON.parse(dbPredict);
        // 	let pred = dbPredictda[e.features[0].properties[DBSCANdistance]];
        // 	if (e.features[0].properties[DBSCANdistance] == -1) pred = 0;
        // 	description += "Predicted # of Crimes: " + pred + "<br>";
        // }

        // // Ensure that if the map is zoomed out such that multiple
        // // copies of the feature are visible, the popup appears
        // // over the copy being pointed to.
        // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        // 	coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        // }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup
            .setLngLat([
                e.features[0].properties['Longitude'],
                e.features[0].properties['Latitude']
            ])
            .setHTML(description)
            .addTo(map);
    });

    map.on('mouseleave', 'crimes', function () {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
}

function removeExistingClusterLayers(map) {
    for (let i = 0; i < 10000; i++) {
        let currClusterID = 'cluster' + i;
        if (map.getLayer(currClusterID)) {
            // Remove map layer & source.
            map.removeLayer(currClusterID).removeSource(currClusterID);
        }
        if (typeof map.getLayer(currClusterID + '_') !== 'undefined') {
            map.removeLayer(currClusterID + '_').removeSource(
                currClusterID + '_'
            );
        }
    }
}

function addClusterLayer(id, points, color, map) {
    map.addLayer({
        id: id,
        type: 'fill',
        source: {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [points]
                }
            }
        },
        layout: {},
        paint: {
            'fill-color': color,
            'fill-opacity': 0.4
        }
    });
}

function applyFilters(map) {
    map.setFilter('crimes', undefined);
    let ctCommittedArray = new Array();
    let timeCommittedArray = new Array();
    let dateCommittedArray = new Array();
    ctCommittedArray.push('in');
    ctCommittedArray.push('Category');
    timeCommittedArray.push('in');
    timeCommittedArray.push('Time');
    dateCommittedArray.push('in');
    dateCommittedArray.push('Date');
    ctCommitted.forEach(v => {
        ctCommittedArray.push(v);
    });
    timeCommitted.forEach(v => {
        timeCommittedArray.push(v);
    });
    dateCommitted.forEach(v => {
        dateCommittedArray.push(v);
    });
    map.setFilter('crimes', [
        'all',
        ctCommittedArray,
        timeCommittedArray,
        dateCommittedArray
    ]);
}

function removeExistingPredictionLayer(map) {
    if (map.getLayer('prediction-results')) {
        map.removeLayer('prediction-results').removeSource(
            'prediction-result-sum'
        );
    }
}

function changeFunctionsHookUp(map) {
    $('.change').change(function () {
        const opType = $(this)
            .prop('name')
            .slice(0, 3);
        const timeValue = $(this)
            .prop('name')
            .slice(4);
        const typeValue = $(this)
            .prop('name')
            .slice(10);
        const isChecked = $(this).prop('checked');
        if (opType === 'day') {
            if (timeValue === 'ALL') {
                if (!isChecked) return;
                dates.forEach(function (value) {
                    dateCommitted.add(value);
                });
                $('#dates input:checkbox').prop('checked', true);
                $("#dates input:checkbox[name='day-NONE']").prop(
                    'checked',
                    false
                );
            } else if (timeValue === 'NONE') {
                if (!isChecked) return;
                dateCommitted.clear();
                $('#dates input:checkbox').prop('checked', false);
                $("#dates input:checkbox[name='day-NONE']").prop(
                    'checked',
                    true
                );
            } else {
                const daysNumDict = {
                    Mondays: 1,
                    Tuesdays: 2,
                    Wednesdays: 3,
                    Thursdays: 4,
                    Fridays: 5,
                    Saturdays: 6,
                    Sundays: 0
                };
                const dayString = timeValue;

                dates.forEach(function (value) {
                    let curDate = new Date(value);
                    if (curDate.getDay() === daysNumDict[dayString]) {
                        if (!isChecked) {
                            dateCommitted.delete(value);
                        } else {
                            dateCommitted.add(value);
                        }
                    }
                });
            }
        } else if (opType === 'tod') {
            if (timeValue === 'ALL') {
                if (!isChecked) return;
                times.forEach(function (value) {
                    timeCommitted.add(value);
                });
                $('#timeOfDay input:checkbox').prop('checked', true);
                $("#timeOfDay input:checkbox[name='tod-NONE']").prop(
                    'checked',
                    false
                );
            } else if (timeValue === 'NONE') {
                if (!isChecked) return;
                timeCommitted.clear();
                $('#timeOfDay input:checkbox').prop('checked', false);
                $("#timeOfDay input:checkbox[name='tod-None']").prop(
                    'checked',
                    true
                );
            } else {
                const todDict = {
                    Morning: [5, 10],
                    Noon: [11, 14],
                    Afternoon: [15, 18],
                    Evening: [19, 23],
                    Night: [0, 4]
                };
                let hour;
                times.forEach(function (value) {
                    hour = parseInt(value.split(':')[0]);
                    if (
                        hour >= todDict[timeValue][0] &&
                        hour <= todDict[timeValue][1]
                    ) {
                        if (!isChecked) {
                            timeCommitted.delete(value);
                        } else {
                            timeCommitted.add(value);
                        }
                    }
                });
                if (!isChecked) {
                    $("#timeOfDay input:checkbox[name='tod-ALL']").prop(
                        'checked',
                        false
                    );
                } else {
                    $("#timeOfDay input:checkbox[name='tod-None']").prop(
                        'checked',
                        false
                    );
                }
            }
        } else if (
            $(this)
                .prop('name')
                .slice(0, 9) === 'crimeType'
        ) {
            if (typeValue === 'ALL') {
                if (!isChecked) return;
                ct.forEach(function (value) {
                    ctCommitted.add(value);
                });
                $('#crimeType input:checkbox').prop('checked', true);
                $("#crimeType input:checkbox[name='crimeType-NONE']").prop(
                    'checked',
                    false
                );
            } else if (typeValue === 'NONE') {
                if (!isChecked) return;
                ctCommitted.clear();
                $('#crimeType input:checkbox').prop('checked', false);
                $("#crimeType input:checkbox[name='crimeType-NONE']").prop(
                    'checked',
                    true
                );
            } else {
                if (!isChecked) {
                    ctCommitted.delete(typeValue);
                    $("#crimeType input[name='crimeType-ALL']:checkbox").prop(
                        'checked',
                        false
                    );
                } else {
                    ctCommitted.add(typeValue);
                    $("#crimeType input[name='crimeType-NONE']:checkbox").prop(
                        'checked',
                        false
                    );
                }
                if (!isChecked) {
                    $("#crimeType input:checkbox[name='crimeType-ALL']").prop(
                        'checked',
                        false
                    );
                } else {
                    $("#crimeType input:checkbox[name='crimeType-None']").prop(
                        'checked',
                        false
                    );
                }
            }
        }
        applyFilters(map);
    });
}

function submitFunctionHookUp(map) {
    $('#submit').click(function () {
        dateFrom = new Date(document.getElementById('date-from').value);
        dateTo = new Date(document.getElementById('date-to').value);
        $("#dates input[name='day-NONE']:checkbox").prop('checked', false);
        let date;
        dates.forEach(v => {
            date = new Date(v);
            if (date >= dateFrom && date <= dateTo) {
                dateCommitted.add(v);
            }
        });
        applyFilters(map);
    });
}

function calculateApproximateCentroidsForClusters(points) {
    let lat_sum = 0;
    let lat_count = 0;
    let lon_sum = 0;
    let lon_count = 0;
    points.forEach(value => {
        lat_sum += value[1];
        lon_sum += value[0];
        lat_count += 1;
        lon_count += 1;
    });
    // shifting the centroid from the center so that in some clusters - e.g. a cluster like a triangle,
    // the number won't be too off the cluster. The point is shiftted towards the upper-right direction
    // just because on the USC DPS dataset, the north - west corner tends to form a huge triangle with the angle
    // on the upper right portion being 90 degrees; but this may not apply to other datasets.
    // Needs to come up with better idea to get approximateCentroidsForClusters.
    approximateCentroidsForClusters.push([
        (lon_sum / lon_count), // * 0.999999999 (to shift)
        (lat_sum / lat_count) // * 1.00000001 (to shift)
    ]);
}
function addClusterLayersFromBoundaries(data, map) {
    // for each cluster
    for (let i = 0; i < data.length; ++i) {
        let points = data[i];

        // calculate the approximate 'central' points for displaying the number of crimes
        calculateApproximateCentroidsForClusters(points);

        let clusterID = 'cluster' + i;
        // this part corresponds to a path that crosses, which causes abnormal behavior from mapbox API
        // An example will be a path that looks like the writing order of '8'
        // To solve the issue, the following code finds the middle part of the path that draws the second circle of
        // the '8', and then set `points` to be the first circle in the '8'.
        if (points.length >= 7) {
            let path_idx = new Map();
            for (let j = 0; j < points.length; ++j) {
                // javascript set doesn't compare the actual values of an array
                // therefore, `set.add([1,2]); set.add([1,2]);` results in a set with two elements
                // therefore, here we use `x * 10000 + y` as a simple hash function to represent the pair [x,y]
                let hash = points[j][0] * 10000 + points[j][1];
                if (path_idx.has(hash)) {
                    addClusterLayer(
                        clusterID + '_',
                        points.slice(path_idx.get(hash), j),
                        colorArr[2 * i + 3],
                        map
                    );
                    // console.log(colorArr[2 * i + 3], points)
                    points.slice(path_idx.get(hash), j);
                    points = data[i]
                        .slice(0, path_idx.get(hash))
                        .concat(data[i].slice(j));
                    // one edge case for unusual mapbox behavior for add layer `fill` type
                    if (j === points.length - 1) {
                        points = [data[i][j]].slice(data[i].slice(0, path_idx.get(hash)));
                    }
                    break;
                }
                path_idx.set(hash, j);
            }
        }
        addClusterLayer(clusterID, points, colorArr[2 * i + 3], map);
        // console.log(colorArr[2 * i + 3], points)
    }
}

function cluster(map) {
    removeExistingClusterLayers(map);
    removeExistingPredictionLayer(map);
    const x = updateFilteredPoints();

    $('.cluster-button')[0].classList.add('loading');
    $('.cluster-button')[0].classList.add('loading-lrg');

    const grid_x = document.getElementById('grid-x').value;
    const grid_y = document.getElementById('grid-y').value;
    const threshold = document.getElementById('threshold').value;

    $.ajax({
        type: 'POST',
        url: 'http://localhost:8000/crimePred/heterogeneous-cluster',
        async: false,
        data: JSON.stringify({
            features: x,
            gridShape: '(' + grid_x + ',' + grid_y + ')',
            threshold: threshold
        }),
        success: (data) => {
            data = JSON.parse(data);
            [border_result, crime_counts, clusters, realCrimes] = data;
            addClusterLayersFromBoundaries(border_result, map);
            $('.cluster-button')[0].classList.remove('loading'); //clear the loading spinner for cluster
        },
        fail: (xhr, textStatus, errorThrown) => {
            alert(`request failed with textStatus: ${textStatus} and error:
            ${errorThrown}`);
            $('.cluster-button')[0].classList.remove('loading');
        }
    });
}
function clusterButtonHookUp(map) {
    $('.cluster-button')[0].classList.remove('disabled');
    $('.cluster-button').click(function () {
        cluster(map);
    });
}

function addPredictedNumbersToMap(crimesPredicted, map) {
    let predictedCountsData = { type: 'FeatureCollection' };
    let features = new Array();
    crimesPredicted.forEach((value, index) => {
        features.push({
            type: 'Feature',
            properties: {
                counts: String(value)
            },
            geometry: {
                type: 'Point',
                coordinates: approximateCentroidsForClusters[index]
            }
        });
    });
    predictedCountsData['features'] = features;
    removeExistingPredictionLayer(map);
    map.addSource('prediction-result-sum', {
        type: 'geojson',
        data: predictedCountsData
    });
    map.addLayer({
        id: 'prediction-results',
        type: 'symbol',
        source: 'prediction-result-sum',
        layout: {
            'text-field': ['get', 'counts'],
            'text-justify': 'auto',
            'symbol-spacing': 1,
            'text-size': 12
        }
    });
}

function predictButtonHookUp(map) {
    $('.predict-button')[0].classList.remove('disabled');
    $('.predict-button').click(function () {
        $('.predict-button')[0].classList.add('loading');
        $('.predict-button')[0].classList.add('loading-lrg');
        if (!clusters) {
            cluster(map);
        }
        const x = updateFilteredPoints();
        $.ajax({
            type: 'POST',
            url: 'http://localhost:8000/crimePred/cluster-predict',
            data: JSON.stringify({
                features: x,
                periodsAhead: $('#periods-ahead').val(),
                method: $('input[name=prediction-method]:checked')[0].value,
                'grid-x': $('#grid-x').val(),
                'grid-y': $('#grid-y').val(),
                threshold: $('#threshold').val(),
                metricPrecision: $('#metric-precision').val(),
                metricMax: $('#metric-max').val(),
                retrainModel: $('.retrain-model-checkbox').prop('checked'),
                clusters,
                realCrimes
            }),
            success: (response) => {
                const [crimesPredicted, imageData] = JSON.parse(response);
                addPredictedNumbersToMap(crimesPredicted, map);
                if ($('.empty')[0]) {
                    $('.empty')[0].remove();
                }
                $('.result')[0].innerHTML += `<img src="data:image/png;base64, ${imageData}"/>`
                $('.predict-button')[0].classList.remove('loading');
                $('.clear-button')[0].classList.remove('disabled');
            },
            fail: (xhr, textStatus, errorThrown) => {
                alert(`request failed with textStatus: ${textStatus} and error:
                ${errorThrown}`);
                $('.predict-button')[0].classList.remove('loading');
            }
        });
    });
}

function clearPlotsButtonHookUp() {
    $('.clear-button').click(() => {
        $('.result')[0].innerHTML = `
        <div class="empty img-fit-cover d-visible">
            <div class="empty-icon">
                <i class="icon icon-photo"></i>
            </div>
            <p class="empty-title h5">You have no results.</p>
        </div>`;
        $('.clear-button')[0].classList.add('disabled');
    });
}

function formatDataToMapbox() {
    let mapbox = {
        type: 'FeatureCollection',
        name: 'dps',
        crs: {
            type: 'name',
            properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
        },
        features: []
    };
    for (let i = 0; i < dataCrimes.length; ++i) {
        mapbox['features'].push({
            type: 'Feature',
            properties: dataCrimes[i],
            geometry: {
                type: 'Point',
                coordinates: [
                    dataCrimes[i]['Longitude'],
                    dataCrimes[i]['Latitude']
                ]
            }
        });
    }
    return mapbox;
}

function addAllCrimePoints(map) {
    //MAP LAYER: ALL CRIMES
    map.addLayer({
        id: 'crimes',
        type: 'circle',
        source: 'dataCrimes',
        paint: {
            'circle-radius': {
                base: 3.25,
                stops: [[12, 3.5], [22, 180]]
            },
            'circle-color': colorArr,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
        }
    });
}

function loadmap() {
    for (let i = 0; i < dataCrimes.length; i++) {
        ct.add(dataCrimes[i]['Category']);
        dates.add(dataCrimes[i]['Date']);
        times.add(dataCrimes[i]['Time']);
        ctCommitted.add(dataCrimes[i]['Category']);
        dateCommitted.add(dataCrimes[i]['Date']);
        timeCommitted.add(dataCrimes[i]['Time']);
    }
    appendDates();
    appendTimes();
    appendCrimeTypes();

    let DBSCANdistance = '0cluster';
    colorArr = colors(DBSCANdistance);
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9',
        center: [-118.2851, 34.026],
        zoom: 14
    });
    mapboxData = formatDataToMapbox();
    map.on('load', function () {
        map.addSource('dataCrimes', {
            type: 'geojson',
            data: mapboxData
        });
        addAllCrimePoints(map);
        let popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });
        mouseOnPointsEvent(popup, map);
        map.setFilter('crimes', ['all']);
    });
    changeFunctionsHookUp(map);
    submitFunctionHookUp(map);
    clusterButtonHookUp(map);
    predictButtonHookUp(map);
    clearPlotsButtonHookUp();
}

function handleFileSelect(evt) {
    let files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    for (let i = 0, f; (f = files[i]); i++) {
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
            };
        })(f);
        reader.readAsText(f);
    }
}

document
    .getElementsByClassName('files')[0]
    .addEventListener('change', handleFileSelect, false);

// $(document).ready(function () {
// 	$("#DBPredict").click(function () {
// 		console.log("dbPredict selected");
// 		//if(dbPredict.length == 0) do nothing
// 		x = updateFilteredPoints()
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
// 		x = updateFilteredPoints()
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

// function findDBScanCluster(DBSCANdistance, features) {
// 	let DBScanClusterTimeSeries = {};
// 	//find the week that the crime occurred
// 	//find the cluster of the crime
// 	//append the crime's cluster of the crime's
// 	for (let i = 0; i < features.length; i++) {
// 		d = features[i][3];
// 		let dayOfCrime = new Date(d);
// 		let dayDiff = dayOfCrime.getDate() - dayOfCrime.getDay();
// 		let weekOfCrime = new Date(dayOfCrime.setDate(dayDiff));
// 		weekOfCrime.setHours(0);
// 		weekOfCrime.setMinutes(0);
// 		weekOfCrime.setSeconds(0);
// 		weekOfCrime.setMilliseconds(0);
// 		let cluster = features[i].properties[DBSCANdistance];
// 		if (!(weekOfCrime.getTime() in DBScanClusterTimeSeries)) {
// 			DBScanClusterTimeSeries[weekOfCrime.getTime()] = 0;
// 		}
// 		DBScanClusterTimeSeries[weekOfCrime.getTime()]++;
// 	}
// 	DBScanClusterTimeSeriesArray = [];
// 	keys = Object.keys(DBScanClusterTimeSeries).sort();
// 	last = keys.length - 1;
// 	while (keys[last] == "NaN") {
// 		last--;
// 	}
// 	date = new Date();
// 	lastDate = new Date();
// 	date.setTime(keys[0]);
// 	lastDate.setTime(keys[last]);
// 	while (date <= lastDate) {
// 		if (date.getTime() in DBScanClusterTimeSeries) {
// 			DBScanClusterTimeSeriesArray.push(DBScanClusterTimeSeries[date.getTime()]);
// 		} else {
// 			DBScanClusterTimeSeriesArray.push(0);
// 		}
// 		date.setDate(date.getDate() + 7);
// 	}
// 	return DBScanClusterTimeSeriesArray;
// }
