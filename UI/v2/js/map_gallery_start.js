var map;
var curLayer;
var zipLayer;
var legend;
var curData = [];
var baseLayers = {};



$(document).ready(function() {
	
	baseLayers['cloudmade'] = L.tileLayer("http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/{styleId}/256/{z}/{x}/{y}.png", {styleId: 22677});
	
	baseLayers['google'] = L.tileLayer("https://mts{s}.googleapis.com/vt?lyrs=m@207265067&src=apiv3&hl=zh-EN&x={x}&y={y}&z={z}&s=Ga&style=api%7Csmartmaps",{subdomains:"123", attribution:"Map Source from Google"});
	
	map = new L.map("div_map", {
		center: [35,-100],
		zoom: 4,
		layers: [baseLayers[$(".basemap.selected").attr("id")]],
		attributionControl: false
	}); 
		
	
	//Set up event handlers...
	$("#div_gallery .basemap").click(function (e) {
		$(".basemap.selected").toggleClass("selected selectable");
		$(this).toggleClass("selected selectable");
		
		var curSelected = $(this).attr("id");

		map.removeLayer( (curSelected == "google") ? baseLayers["cloudmade"] : baseLayers["google"]);
		map.addLayer( (curSelected == "google") ? baseLayers["google"] : baseLayers["cloudmade"]);
		
		if (curLayer instanceof L.TileLayer.heatMap) {
			map.removeLayer(curLayer);
			map.addLayer(curLayer);
		}
	});
	
	$("#div_gallery .features").click(function(e) { 
		if (curData.length > 0) { 
			$(".features.selected").toggleClass("selected selectable");
			$(this).toggleClass("selected selectable"); 	
				
			switchLayers( $(this).attr("id"));
		}
	});
	
	$("#submit_button").click(function (e) { $("#img_loading").show(); });
	
	$('#upload_excel').ajaxForm({
		dataType:  'json',
		timeout: 20000,  
		success: function(data) { 
			setData(data); 
			map.fitBounds(curLayer.getBounds());
			$("#img_loading").hide();
		}, 
		error: function(e) { 
			console.log(e);
		}
	});
	
});

function enableCensusLayer() {
	// get color depending on population density value
	function getColor(d) {
		return d > 94913  ? '#800026' :
			   d > 81354   ? '#BD0026' :
			   d > 67795   ? '#E31A1C' :
			   d > 54236   ? '#FC4E2A' :
			   d > 40677    ? '#FD8D3C' :
			   d > 27118    ? '#FEB24C' :
			   d >  13559    ? '#FED976' :
						  '#FFEDA0';
	}

	function style(feature) {
		return {
			weight: 2,
			opacity: 1,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.6,
			fillColor: getColor(feature.properties.income)
		};
	}	
		
	zipLayer = new L.geoJson(zipCodes, {style: style});
	map.addLayer(zipLayer);
	if (!legend) {
		legend = L.control({position: 'bottomright'});

		legend.onAdd = function (map) {

			var div = L.DomUtil.create('div', 'info legend'),
				grades = [0, 13559    , 27118    , 40677    , 54236   , 67795   , 81354   , 94913  ],
				labels = ['<div style="font-weight: 900; ">Household Income</div>'],
				from, to;

			for (var i = 0; i < grades.length; i++) {
				from = grades[i];
				to = grades[i + 1];

				labels.push(
					'<i style="background:' + getColor(from + 1) + '"></i> $' +
					from + (to ? '&ndash;$' + to : '+'));
			}

			div.innerHTML = labels.join('<br>');
			return div;
		};

		legend.addTo(map);
	}
}


function switchLayers(newLayerName) { 

	if (curLayer && map.hasLayer(curLayer)) map.removeLayer(curLayer);

	if (zipLayer && map.hasLayer(zipLayer)) map.removeLayer(zipLayer);
	$(".legend").hide();
	
	if (newLayerName == "heatmap") {
		curLayer = getHeatmapLayer(curData);
		map.addLayer(curLayer);
	} else if (newLayerName == "point") { 
		curLayer = getPointLayer(curData);
		map.addLayer(curLayer);
	} else if (newLayerName == "cluster") { 
		curLayer = getClusterLayer(curData);
		map.addLayer(curLayer);
	} else if (newLayerName == "census") {
		enableCensusLayer();
		$(".legend").show();
		curLayer = getPointLayer(curData);
		map.addLayer(curLayer);
	}
}
	
function getClusterLayer(gjData) {
	var clusterLayer = new L.MarkerClusterGroup({ 
		spiderfyOnMaxZoom: false, 
		showCoverageOnHover: true, 
		zoomToBoundsOnClick: false
	});
	
	
	clusterLayer.on('clusterclick', function (e) {
		if(!e.layer._popup) {
			//Use tables to align everything???
			var properties = pathgeo.util.readClusterFeatureProperies(e.layer, []);
			var html = "<div class='popup'><p style='font-weight: 900;'>There are " + e.layer._childCount + " addresses:</p><ul>";
			$.each(properties, function(i, property){
				html += "<li><span class='ui-icon ui-icon-circle-plus iconExpand' style='display:inline-block'></span><span class='clusterInfo'>" + property.name + "</span><br><div class='extras' style='margin-bottom: 10px;'><b>Location:</b>" + property.location + "<br><b>Sales:</b> $" + property.sales + "</div></li>";
			});
			html+="</ul></div>";
						
			e.layer.bindPopup(html,{maxWidth:500, maxHeight:300}).openPopup();
			
		} else {
			e.layer.openPopup();
		}
		$(".iconExpand").click(function(e) { 
			var element = $(this);
		
			element.siblings(".extras").toggle();  
			
			if (element.hasClass("ui-icon-circle-plus")) {
				element.removeClass("ui-icon-circle-plus");
				element.addClass("ui-icon-circle-minus");
			} else {
				element.removeClass("ui-icon-circle-minus");
				element.addClass("ui-icon-circle-plus");
			}
		});
	});
	
	
	clusterLayer.addLayer(getPointLayer(gjData));
	
	return clusterLayer;
}


//Excpects an array of geoJson features
function getPointLayer(gjData) { 
	var pointLayer = new L.geoJson([], {
		onEachFeature: function (feature, layer) {
			var props = feature.properties;
			var html = "<div class='popup'><ul><li><span class='clusterInfo'>" + props.name + "</span><br><div class='extras' style='display: block;'><b>Location:</b> " + props.location + "<br> <b>Sales:</b> $" + props.sales + "</li></ul></div>";
			layer.bindPopup(html);
		}
	});
	
	for (var indx in gjData) {
		pointLayer.addData(gjData[indx]);
	}
	
	return pointLayer;
}

function getHeatmapLayer(gjData) {
	var heatmapLayer = new L.TileLayer.heatMap({ 
		radius: 40,
		opacity: 0.75,
		gradient: {
			0.45: "rgb(0,0,255)",
			0.65: "rgb(0,255,255)",
			0.85: "rgb(0,255,0)",
			0.98: "yellow",
			1.0: "rgb(255,0,0)"
		}
	});
	
	var heatmapData = [];
	
	for (var indx in gjData) {
		heatmapData.push( { lat: gjData[indx].geometry.coordinates[1], lon: gjData[indx].geometry.coordinates[0], value: 1 } );
	}
	
	heatmapLayer.addData(heatmapData);
	return heatmapLayer;
}

function setData(data) {
	curData = data;
	
	$(".features").removeClass("selected").addClass("selectable");
	switchLayers("point");
	$("#point").toggleClass("selected selectable");
}
		



