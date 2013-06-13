//Load Google Charts and set callback
google.load("visualization", "1", {packages:["corechart", "table"]});

//var locationY;
//var locationX;

var app={
	map:null,
	basemaps:{
			"Cloudmade": L.tileLayer("http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/{styleId}/256/{z}/{x}/{y}.png", {styleId: 22677}),
			"OpenStreetMap": L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
			//"Google Streetmap":L.tileLayer("https://mts{s}.googleapis.com/vt?lyrs=m@207265067&src=apiv3&hl=zh-TW&x={x}&y={y}&z={z}&s=Ga&style=api%7Csmartmaps",{subdomains:"123", attribution:"Map Source from Google"})
	},
	layers: {
			"demographicData":null,
			selectedZipcodeLayer:null
	},
	socialMediaResult:{
			type:"GEOJSON",
			url: null,
			json:null,
			title: null,
			column:{
				statistics:""
			},
			keywords:[]
	},
	controls:{
		mapGallery: L.Control.extend({
		    options: {collapsed: true,position: 'topright',text: 'Map Gallery',},
			initialize: function (options) {L.Util.setOptions(this, options);},
		    onAdd: function (map) {
	        	// create the control container with a particular class name
		        var container=L.DomUtil.create('div', 'leaflet-control-mapGallery');
		        var html="<ul><li title='Marker map' layer='geoJsonLayer' style='background-color:#5B92C0'><img src='images/marker-icon.png' /></li><li title='Cluster map' layer='markerClusterLayer'><img src='images/gallery-cluster.png' /></li><li title='Heat map' layer='heatMapLayer'><img src='images/gallery-heatmap.png' /></li></ul>";
       
		         //click map gallery event
		        $(container).html(html)
		        			.find("ul li").click(function(){
					        	var $this=$(this),
					        		value=$this.attr("layer"),
					        		layer=app.socialMediaResult[value];
					        		
									
					        	//if this layer is already shown on the map, hide the layer and change the color
					        	if(layer){
									if(layer._map){
										//if(value=='heatMapLayer') alert(value);
										//document.getElementById('slider').style.opacity = "0";
						        		app.map.removeLayer(layer);
						        		$this.css({"background-color": ''});
						        	}else{
						        		layer.addTo(app.map);
						        		$this.css({"background-color": '#5B92C0'});
										
										//show heatmap radius content
										if(value=='heatMapLayer'){
											$("#heatmap_radius").show()
										}
						        	}
								}
								
					        });
		        
		        return container
		    }
		}),
		toc:null,
		legend: L.Control.extend({
		    options: {position: 'bottomright',text: 'Legend',},
			initialize: function (options) {L.Util.setOptions(this, options);},
		    onAdd: function (map) {
		        // create the control container with a particular class name
		        return L.DomUtil.create('div', 'leaflet-control-legend');
		    }
		})
	},
	popup:null,
	initCenterLatLng:[35,-100],
	initCenterZoom:4,
	showLayers:[], //layers are shown in the map
	dataTable:null,
	demographicData:{
	
		"fam_size" : "average faimily size",
		"income" : "median household income",
		"age0_9" : "age 5 to 9 years",
		"age10_19" : "age 10 to 19 years",
		"age20_64" : "age 20 to 64 years",
		"age65_abov" : "age 65 years and above",
		"pop" : "population",
		"popDen" : "population density"
	
	/*
		"HC01_VC04":"Population 16 years and over",
		"HC01_VC20":"Own children under 6 years",
		"HC01_VC21":"All parents in family in labor force",
		"HC01_VC23":"Own children 6 to 17 years",
		"HC01_VC28":"Workers 16 years and over",
		"HC01_VC74":"Total households",
		"HC01_VC85":"Median household income",
		"HC01_VC86":"Mean household income",
		"HC01_VC112":"Median family income",
		"HC01_VC113":"Mean family income",
		"HC01_VC115":"Per capita income"
	*/
	},
	geojsonReader: new jsts.io.GeoJSONReader(),
	mapGalleryHtml:"",
	css:{
		"dataTable_highlightRow":{"background-color":"#ED3D86", "color":"#ffffff"}
	},
	$tr:null,
	centerPoint:null,
	maskCanvas:null
}



//read demographic data
pathgeo.service.demographicData({
	// filter:{
		// type:"zipcode",
		// value:"94131"
	// },
	callback:function(geojsonLayer){
		app.layers.demographicData=geojsonLayer;		
		//showDemo data
		//showDemo('SAN FRANCISCO');
	}
});



//init
$(document).on("pageshow", function(){	  
	init_UI();
   
   	init_map();
});





//init openlayers
function init_map(){
	app.map = L.map("div_map", {
        center: app.initCenterLatLng,
		zoom: app.initCenterZoom,
		layers:[app.basemaps["Cloudmade"]],
		attributionControl:true,
		trackResize:true
    }); 
	
	//move the location of zoomcontrol to the bottom right
	app.map.zoomControl.setPosition("topright");
	
	//layers control
	app.controls.toc=L.control.layers(app.basemaps).setPosition("topright");

	//map gallery control
	$.each(app.controls, function(k,v){
		//toc is hidden in the map
		if(k=="toc"){
			app.map.addControl(v);
		}else{
			app.map.addControl(new v());
		}
	});
	
	
	
	//change leaflet attribution
	$(".leaflet-control-attribution a:first-child").attr("href", "http://www.pathgeo.com").html("PathGeo");
	app.map.on("baselayerchange", function(e){
		$(".leaflet-control-attribution a:first-child").attr("href", "http://www.pathgeo.com").html("PathGeo");
	})

	
	//open popup event
	app.map.on({
		'popupopen':function(e){
			//if the popup source is zipcode layer
			if($(e.popup._content).hasClass('zipcodePopup')){
				$(".leaflet-tile-pane").css({opacity:0.3, "z-index":6});
			}
		},
		'popupclose':function(e){
			//if the popup source is zipcode layer
			if($(e.popup._content).hasClass('zipcodePopup')){
				$(".leaflet-tile-pane").css({opacity:1, "z-index":2});
			}
		},
		'move':function(e){
			app.centerPoint.setLatLng(app.map.getCenter());
		}
	});
	
	
	//create a center point marker
	var icon=new L.icon({
			iconUrl: "images/1370980243_target.png",
			iconSize: [24, 24],//[12.5, 21],
			iconAnchor: [12, 12]
	});		
	app.centerPoint=new L.marker(app.map.getCenter(), {icon: icon});
	app.map.addLayer(app.centerPoint)
}



//init UI
function init_UI(){
	
	//content height
	$("#content").height($(window).height()-$("#header").height());
	
	
	//show main menu
	//if directly show the main menu while initlizing the webpage, the main menu will be immediately disppeared in Chrome (noraml in the Firefo).
	//JQM said this is the bug from webkit(Goolge chrome) https://github.com/jquery/jquery-mobile/issues/5775
	setTimeout(function(){
		$("#dialog_menu").popup("open");
	},1000);
	
	
	//adjust infoPanel height
	$(".infoPanel").css({height:$("#content").height()-20, width:$("#content").width()*0.375});
	
	
	
	
	//when window resize
	$(window).resize(function(){
		$("#content").height($(window).height()-$("#header").height());
		$(".infoPanel").css({height:$("#content").height()-20, width:$("#content").width()*0.375});
	})
	
	
	//slider
	 $('#slider').nivoSlider({
	 	effect: "fade"
	 });
	 

	 
	//when mouse click on otherplace, hide dataTable_menu
	$(document).mouseup(function(e){
		var $container=$(".dataTable_menu, #dataTable_chartControlMenu, #heatmap_radius");
		if(!$container.is(e.target) && $container.has(e.target).length===0){
			$container.hide();
		}
	});
	
	
	//businessActions selection change
	$("#businessActions_type").change(function(){
		showBusinessAction(this.value);
	});
	
	//add close button in the infoPanel
	$(".infoPanel").append("<a id='closeInfoPanel' href='#' data-role='button' data-theme='a' data-icon='delete' data-iconpos='notext'  style='position:absolute; right:-10px; top:-6px;z-index:500;' onclick='closeInfoPanel()'>Close</a>")
	$(".infoPanel #closeInfoPanel").buttonMarkup("refresh");
	
	
	
	//Keep track of currently uploaded file 
	var currentFileName = '';

	//This is necessary to prevent being redirected when uploading data...
	$('#uploadData_form').on('submit', function (e) {
		if (e.preventDefault) e.preventDefault();
		return false;
	});
			
	//Submits form when user selects a file to upload
	//The reponse is a list of column names, which are used to populate the drop-down menu
	$("#uploadData_input").change(function() { 
		$("#geocoding_loading").css({position:"absolute", top:"45px", right:"40px"}).show();
		
		$("#uploadData_form").ajaxSubmit({
			dataType: 'json',		
			success: function (tableInfo) {
				//remove old options 
				$("#uploadData_geocodingFields").html("");
				
				var columns = tableInfo.columns;
				currentFileName = tableInfo.fileName;
				
				//set new options according to the returned value names
				for (var indx = 0; indx < columns.length; indx++) {
					var column = columns[indx];
					$("#uploadData_geocodingFields").append("<input type='checkbox' id='" + column + "'/>" + column + " <br>");
				}	
								
				$("#uploadData_description, #geocoding_loading").hide();
				$("#uploadData_confirm, #uploadData_controls").show();	
			}, error: function (error) {
				console.log(error.responseText);
			}
		});
	
	});
	
	
	//Submits upload file form and captures the response
	//$('#uploadData_form').submit( function() {
	$('#submit_button').click(function() {
		//var geoColumnVal = $("#uploadData_geocodingField").val();
		var geoColumns = $.map($("#uploadData_geocodingFields").children(":checked"), function(item) { return item.id; });
		var checked = $("#uploadData_agreementCheck").prop("checked");
		
		if (!checked) {
			alert("You must agree to the PathGeo agreement before your data is geocoded.");
			return;
		}
		
		//show geocoding loading icon
		$("#geocoding_loading").css({top:"460px"}).show();
		
		$.ajax({
			dataType: 'json',
			url: "python/retrieveAndGeocode.py", 
			data: { 
				fileName: currentFileName,
				geoColumns: geoColumns
			}, success: function(featureCollection) { 	
				console.log(featureCollection); 
				if (!featureCollection || featureCollection.features.length <= 0) {
					alert("No rows could be geocoded.  Please make sure you have selected the correct location column.");
					return;
				}
							
				if (app.geocodingResult.geoJsonLayer) {
					app.map.removeLayer(app.geocodingResult.geoJsonLayer);
				}
					
				app.geocodingResult  = {
					 type: "GEOJSON",
					 json: featureCollection, 
					 srs: "EPSG:4326",
					 title: "Your Data",
					 keywords: ["testing"]
				 };
				 
				showTable(app.geocodingResult);
				
				$('.ui-dialog').dialog('close');
				//For some reason, the dialog closes very slowly, 
				//so need to delay resetting these components until it is closed
				setTimeout(function() {
					$("#uploadData_description").show();
					$("#uploadData_confirm").hide();
					$("#uploadData_controls").hide();	
					
					//clear checkbox
					$("#uploadData_agreementCheck").attr('checked', false);
					$("#uploadData_agreementCheck").checkboxradio("refresh");
					
					//clear file selected
					$("#uploadData_input").val(''); //not sure this works with IE or Opera
					$("#geocoding_loading").hide();
				}, 100);
	
			}, error: function (error) {
				console.log("Error:");
				console.log(error.responseText);
			}
		});
		
		
	});
	$("#layer_selector").hide();
}




//load geojson
function showLayer(obj, isShow){
		//show title
		if(obj.title){$("#lbl_dataName").html(obj.title);}
		
		//feature count
		obj.featureCount=0;
		
		//layers
		obj.layers=[];
		

		//show layer
		switch(obj.type){
			case "GEOJSON":
				
				//show geojson
				//need to be prior than the main part, otherwise this function will not be triggered in Firefox
				function showGeojson(object){
					parseGeojson(object);
					addLayer(object);
					
					//make geojsonLayer as the default layer > change the background-color of the map gallery icon
					$('.leaflet-control-mapGallery ul li[layer="geoJsonLayer"]').css('background-color', "#5B92C0");
					
					//hide loadData dialog
					$("#dialog_uploadData").popup("close");
				}
				
				
				
				//parse geojson
				function parseGeojson(obj){
					var layers=[], 
						zipcodes={},
						num=0,
						statisticsColumn=obj.column.statistics;
						//totalSum=obj.dataTable.statisticsColumn[statisticsColumn].sum;
					
					
					//on each feature
					function onEachFeature(feature, layer){
						var props = feature.properties,
							html='';
										
							switch(props.Source){
								case "flickr":
									html="<div class='popup'><table border=0><tr><td><img src='"+ props.Img+"' class='popup-img ui-corner-all'/></td><td class='popup-content'><label class='popup-account'>"+ props.Account+"</label><label class='popup-date'>" + props.Date + "</label><h4>" + props.Title + "</h4></td></tr></table></div>";
									//html = "<div class='popup'><ul><li><span class='clusterInfo'>" + props.Title + "</span><br/><img src='" + props.Img + "' alt='...' style='float:left; margin-right:5px'><div class='extras' style='display: block; padding-bottom:20px'> " + props.Account + "<br/><br/>" + props.Date + "</li></ul></div>";
								break;
								case "twitter":
									html="<div class='popup'><table border=0><tr><td><img src='"+ props.Img+"' class='popup-img ui-corner-all'/></td><td class='popup-content'><a href='http://twitter.com/" + props.Account + "' target='_blank' class='popup-account'>" + props.Account + "</a><label class='popup-date'>" + props.Date + "</label><h4>" + props.Title + "</h4></td></tr></table></div>";
									//html="<div class='popup'><table border=0><tr><td><img src='"+ props.Img+"' class='popup-img ui-corner-all'/></td><td><div class='popup-content'><h4>" + props.Title + "<h4><br><a href='http://twitter.com/" + props.Account + "' target='_blank'>" + props.Account + "</a><p></p>" + props.Date + "</div></td></tr></table></div>";
									//html = "<div class='popup'><ul><li><span class='clusterInfo'>" + props.Title + "</span><br/><img src='" + props.Img + "' alt='...' style='float:left; margin-right:5px'><div class='extras' style='display: block;'><a href='http://twitter.com/" + props.Account + "' target='_blank'>" + props.Account + "</a><br/><br/>" + props.Date + "</li></ul></div>";
								break;
							}
									
							//info window
							layer.bindPopup(html, {maxWidth:500, maxHeight:300});		
							
							//id
							layer.pathgeoID=num;
							feature.properties.pathgeoID=num;
							num++;
							
							//event
							layer.on({
								mouseover: function(e){
//									console.log(e.target)
									var target=e.target,
										img=target._icon;
									if(target.options.iconHover){
										img.src=target.options.iconHover.options.iconUrl;
									}
									
									$("#search_results").scrollTop($("#search_results li:eq("+target.pathgeoID+")").position().top);
								},
								mouseout: function(e){
									var target=e.target,
										img=target._icon;
									if(target.options.iconDefault){
										img.src=target.options.iconDefault.options.iconUrl;
									}
									$("#search_results").scrollTop($("#search_results li:eq(0)").position().top);
								},
								click: function(e){
									
								}
							});
						
							layers.push(layer);
					}
	
					
					//point to layer
					function pointToLayer(feature, latlng){
						var url='';
						switch(feature.properties.Source){
							case "flickr":
								url="images/newPhoto.png"
							break;
							case "twitter":
								url="images/newTweet.png";
							break;
						}
									
						var icon=new L.icon({
							iconUrl: url,
							iconSize: [24, 29],//[12.5, 21],
							iconAnchor: [12, 0]
						});
									
						var iconHover=new L.icon({
							iconUrl:url,
							iconSize: [24, 29], //[26, 26],
						  	iconAnchor: [12, 0]
						});
						return new L.marker(latlng, {icon: icon, iconHover:iconHover, iconDefault:icon})
					}
					
					
					
					//marker layer
					obj.geoJsonLayer = new L.geoJson(obj.json, {
								onEachFeature:onEachFeature,
								//style
								style:{},
								//pointToLayer to change layers' icon
								pointToLayer: pointToLayer
					});
					obj.geoJsonLayer.layers=layers;
					obj.geoJsonLayer.addTo(app.map);
					//add geojsonlayer to toc
					app.controls.toc.addOverlay(obj.geoJsonLayer, "Marker Map");
					

					//markercluster layer
					num=0;
					obj.markerClusterLayer = pathgeo.layer.markerCluster(obj.json, {
								onEachFeature:onEachFeature,
								//style
								style:{},
								//pointToLayer to change layers' icon
								pointToLayer: pointToLayer
							},{
								//clusterclick event
								clusterclick: function(e){
									if(!e.layer._popup) {
										//Use tables to align everything???
										var properties = pathgeo.util.readClusterFeatureProperies(e.layer, []);
										var html = "<div class='popup'><p style='font-weight: 900;'>There are " + e.layer._childCount + " addresses:</p><ul>";
										
										$.each(properties, function(i, property){
											if (property.Source == "flickr") {
												html+= "<li row="+ property.pathgeoID +"><label>" + property.Account + ":</label>" + property.Title +"</li>";
												//html += "<li><span class='ui-icon ui-icon-circle-plus iconExpand' style='display:inline-block'></span><span class='clusterInfo'>" + property.Title + "</span><br><div class='extras' style='margin-bottom: 30px;'><img src='" + property.Img + "' alt='...' style='float:left; margin-right:5px'><div class='extras' style='display: block;'> " + property.Account + "<br/><br/>" + property.Date + "</div></li>";
											}else {
												html += "<li row="+ property.pathgeoID +"><span class='ui-icon ui-icon-circle-plus iconExpand' style='display:inline-block'></span><span class='clusterInfo'>" + property.Title + "</span><br><div class='extras' style='margin-bottom: 10px;'><img src='" + property.Img + "' alt='...' style='float:left; margin-right:5px'><div class='extras' style='display: block;'><a href='http://twitter.com/" + property.Account + "' target='_blank'>" + property.Account + "</a><br/><br/>" + property.Date + "</div></li>";
											}
										});
										html+="</ul></div>";
													
										e.layer.bindPopup(html,{maxWidth:500, maxHeight:300}).openPopup();
									}else {
										e.layer.openPopup();
									}
									
									$(".popup li").click(function(e) { 
										console.log($(this).attr('row'))
										$("#search_results").scrollTop($("#search_results li:eq(" + $(this).attr('row') + ")").position().top);
									});
								},
								
								//customize cluster icon
								iconCreateFunction: function(cluster) {
									//return new L.DivIcon({ html: cluster.getChildCount(), className: 'mycluster', iconSize: new L.Point() });
								
									var image='';
									if(obj.source == "twitter"){
										image = "newTweet";
									}else{
										image = "newPhoto";
									}
									
									var amount = cluster.getChildCount(),
										icon="";
									if (amount >=10){
										icon = "<b style='position:absolute; left:2px; top:0px; color:white'>" + amount + "</b><img border='0' src='images/" + image + ".png' width='62' height='74'>";
									}else if (amount >=5){
										icon = "<b style='position:absolute; left:2px; top:0px; color:white'>" + amount + "</b><img border='0' src='images/" + image + ".png'  width='50' height='61'>";
									}else{
										icon = "<b style='position:absolute; left:2px; top:0px; color:white; font-size: 10px'>" + amount + "</b><img border='0' src='images/" + image + ".png'>";
									}
							
									return new L.DivIcon({html: icon, className: 'mycluster' });
								}
							}
					);
					app.controls.toc.addOverlay(obj.markerClusterLayer, "Cluster Map");
					
					
					
					//heatmap
					//heatmap
					var zoomLevel=app.map.getBoundsZoom(obj.geoJsonLayer.getBounds());
					var getRadius = function(i){
						var radius=6.25 * Math.pow(2, (17-zoomLevel+i));
						radius=(radius >= 5050)?5050:radius;
						radius=(radius >= 50)?radius:50;
						return radius;
					};
					//app.controls.toc.removeLayer(obj.heatMapLayer);
					obj.heatMapLayer=pathgeo.layer.heatMap(obj.json, getRadius(0), {opacity:0.55});
					app.controls.toc.addOverlay(obj.heatMapLayer, "Heat Map");
						
					//set up heatmap slider		
					$("#heatmap_slider").attr({
						'min': 50,
						'max':  5050,
						'step': (5050-50)/20,
						'value': getRadius(0)
					}).on("slidestop", function(e){
						var radius=e.currentTarget.value;
						var geocodingResult=app.socialMediaResult;
						//remove existing heatmap
						if(geocodingResult.heatMapLayer._map){app.map.removeLayer(geocodingResult.heatMapLayer);}
						app.controls.toc.removeLayer(geocodingResult.heatMapLayer);
							
						geocodingResult.heatMapLayer=pathgeo.layer.heatMap(geocodingResult.json, radius, {opacity:0.55});
						geocodingResult.heatMapLayer.addTo(app.map);
						app.controls.toc.addOverlay(geocodingResult.heatMapLayer, "Heat Map");
					}).slider('refresh'); 
					$("#heatmap_radius .ui-input-text").html("Change Hot Spot's Radius (unit: Feet)");
					
			
					//maskCanvasLayer
					var bounds=obj.geoJsonLayer.getBounds(),
						centerLatLng=bounds.getCenter(),
						sw=bounds.getSouthWest();
				
					var radius=Math.sqrt((Math.pow(centerLatLng.lng - sw.lng,2) + Math.pow(centerLatLng.lat - sw.lat,2)));
					//convert to meter
					radius=radius*111000+1000;

					obj.maskCanvasLayer=new L.TileLayer.MaskCanvas({
					       radius: radius,  // radius in pixels or in meters (see useAbsoluteRadius)
					       useAbsoluteRadius: true,  // true: r in meters, false: r in pixels
					       color: '#000',  // the color of the layer
					       opacity: 0.3,  // opacity of the not coverted area
					});
					obj.maskCanvasLayer.setData([[centerLatLng.lat, centerLatLng.lng]]);
					app.map.addLayer(obj.maskCanvasLayer);
					app.controls.toc.addOverlay(obj.maskCanvasLayer, "Mask");
					
					
					//showLayerNames
					//if this is the first time to load layers, the showLayerNames will be emplty.
					//so the default layer is geoJsonLayer
//					if(showLayerNames.length==0){showLayerNames.push("geoJsonLayer");};
//					$.each(showLayerNames, function(i, name){
//						obj.layers.push(obj[name]);
//					})
					
				}//end parseGeojson
				
				
				
				//main part
				if(!obj.json){
					$.getJSON(obj.url, function(json){
						//if json is an array of features
						obj.json=(json instanceof Array)?{type:"FeatureCollection", features:json} : json;
						showGeojson(obj);
					});
				}else{
					showGeojson(obj);
				}
				
			break;
			case "WMS":
				//default param
				if(obj.param && obj.param.layers){
					obj.param.format= obj.param.format || 'image/png';
					obj.param.transparent=obj.param.transparent || true
					
					obj.layers.push(L.tileLayer.wms(obj.url, obj.param));
					
					//events
					obj.layers[0].on("load", function(e){
						console.log("loaded");
					});
					
					//obj.layer.setOpacity(0.75).addTo(app.map).bringToFront();
					addLayer(obj);
					app.controls.toc.addOverlay(obj.layers[0], obj.name);
				}
			break;
		}
		
		
		//add layer
		function addLayer(obj){
			if(isShow){
				$.each(obj.layers, function(i,layer){
					layer.addTo(app.map);
					app.showLayers.push(layer);
				})
				
				app.map.fitBounds(obj.geoJsonLayer.getBounds());
	
			}

			//close dialog
			//$("#div_dialog").dialog("destroy");
			$("#img_loading").hide();
		}
}




//switch layer
function switchVisualization(types){
	//remove all shown layers on the map
	removeLayers();
	
	var layer;
	$.each(types, function(i,type){
		switch(type){
			case "MARKERCLUSTER":
				layer=app.geocodingResult.markerClusterLayer.addTo(app.map);
			break;
			case "HEATMAP":
				layer=app.geocodingResult.heatMapLayer.addTo(app.map);
			break;
			case "GEOJSON":
				layer=app.geocodingResult.geoJsonLayer.addTo(app.map);
			break;
		}
		app.showLayers.push(layer);
	});
	
}




//remove all layers on the map
function removeLayers(){

	if(app.showLayers.length>0){
		$.each(app.showLayers, function(i,layer){
			//if toc contains the layer
			if(app.controls.toc._layers[layer._leaflet_id]){
				app.controls.toc.removeLayer(layer);
			}
			//remove layer from the map
			app.map.removeLayer(layer);
		});
		app.showLayers=[];
	}
}



//switch basemap
function switchBaseLayer(layer){
	if(app.map.hasLayer(layer)){
		app.map.removeLayer(layer)
	}else{
		layer.addTo(app.map);}
}





//show pivot table
//This first populates the table, then draws the geojson features
function showTable(obj){
	//hide dataPanel_intro 
	$("#dataPanel_intro").hide();
	
	//clear zipcodelayer if any
	if(app.layers.selectedZipcodeLayer && app.map.hasLayer(app.layers.selectedZipcodeLayer)){
		app.map.removeLayer(app.layers.selectedZipcodeLayer);
		app.layers.selectedZipcodeLayer.clearLayers();
	}
	
	
	if(!obj.json){
		$.getJSON(obj.url, function(json){
			//if json is an array of features
			obj.json=(json instanceof Array)?{type:"FeatureCollection", features:json} : json;
			createTable(obj);
		});
	}else{
		createTable(obj);
	}
	
	
	//create table and chart
	function createTable(obj){
		//convert geojson properties to array
		if(!obj.dataTable){
			obj.dataTable = pathgeo.util.geojsonPropertiesToArray(obj.json, {statisticsColumn: obj.column.statistics});
		}
	
		var dataTable=obj.dataTable;

		//hide columns
		var hiddenColumns = ["Coordinates"];
		$.each(dataTable.columns_dataTable, function(i, column){
			$.each(hiddenColumns, function(j, columnName){
				if (columnName == column.sTitle) {
					column.bVisible = false;
					column.bSearchable = false
				}
			});
		});
		
		//if app.dataTable already exists, clear html in the .dataTable_na nad #dataTableControl to avoid duplicate nav and control toolboxes
		if (app.dataTable) {
			app.dataTable.fnDestroy(); //if there is a exiting dataTable, we need to destroy first. Otherwise, the dataTable will read the previvous one to make errors.
			$(".dataTable_nav, #dataTable_control, #dataTable").html("");
		}
		
		//init app.dataTable
		app.dataTable = $('#dataTable').dataTable({
			"bDestroy": true, //destroy current object if one exists
			"aaData": dataTable.datas, //data
			"aoColumns": dataTable.columns_dataTable, //column
			"bJQueryUI": false,
			"bAutoWidth":true,
			"bPaginate": false,
			"sPaginationType": "two_button", //"full_numbers",    //page number 
			"sScrollY": $("#dataPanel").height()-87,
			"sScrollX": "100%",
			//"bDeferRender": true,
			"oLanguage": {
		      "sSearch": ""
		    },
			"iDisplayLength": 1000,
			"sDom": '<"dataTable_toolbar"<"dataTable_nav"><"dataTable_tools"f><"dataTable_menu"<"infobox_triangle"><"infobox">>><"dataTable_table"rtiS<>>', //DOM
			"fnInitComplete": function(oSettings, json) {
				$("#" + oSettings.sTableId+"_filter input").val("Filter your data....").focus(function(){
					if($(this).val()=="Filter your data...."){
						$(this).val("");
					}
				});
				
				//need to wait a few time to adjust the column size
				setTimeout(function (){
					//backup orginal json to defaultJSON
					if (!obj.defaultJSON) {obj.defaultJSON = obj.json;}
					
					//ajust column width
					app.dataTable.fnAdjustColumnSizing();
					
					//get all tr
					app.$tr=$(".dataTable tr");
					
					//draw layers on the map
					showLayer(obj, true);
								
					//re-draw Chart
					showDataTableChart(obj.json);
				}, 10);
				
		    },
			"fnRowCallback": function(nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
				//only give the attr "_featureID" into each tr at the first time
				if($(nRow).attr("_featureID")==undefined){
					$(nRow).attr({"_featureID": iDisplayIndexFull, "_rowID": iDisplayIndexFull});
					
					var properties=obj.json.features[iDisplayIndexFull].properties;
					properties["_featureID"]=iDisplayIndexFull;
					properties["_rowID"]=iDisplayIndexFull;
				}
		    },
			fnDrawCallback: function(oSettings){
				
				//only works while filter input box is focused!! 
				if($(".dataTables_filter input").is(":focus")){
					//console.log('filter refresh map');
					
					//get filter data,
					var me = this, 
						features = obj.defaultJSON.features, 
						geojson = {
							type: "FeatureCollection",
							features: []
						}, 
						feature, 
						$selectedData = me.$('tr', {"filter": "applied"});
				
					//remove demographic data
					if (app.layers.demographicData) {
						app.map.removeLayer(app.layers.demographicData);
					}
							
					//reset table style
					var $tr = $("#dataTable tr");
					$.each(app.css["dataTable_highlightRow"], function(k, v){ $tr.css(k, "");});
					
					
					//to avoid refresh too frequently to mark high CPU usage
					setTimeout(function(){
						if (me.$('tr', {"filter": "applied"}).length == $selectedData.length) {
							//read selected layers
							var zipcodes={}, zipcode=''
							me.$('tr', {"filter": "applied"}).each(function(i,tr){
								feature = features[this._DT_RowIndex];
								feature.properties["_rowID"]=i;
								geojson.features.push(feature);
								
								//save zipcode
								zipcode=feature.properties["zip"];
								if(zipcode){
									if(zipcodes[zipcode]){
										zipcodes[zipcode]+=1;
									}else{
										zipcodes[zipcode]=1;
									}
								}
							});
							
							//convert zipcodes object to array
							zipcodes=$.map(zipcodes, function(v,k){return k});
							
							//overwrite app.geocodingResult.json and showlayer 
							if (geojson.features.length > 0){
								obj.json = geojson;
								showLayer(obj, true);
								
								//re-draw Chart
								showDataTableChart(obj.json);
								
								if(zipcodes.length>0){
									//if users cancel the keywords, or didnot do any filter, then hide zipcode layer
									if(me.$('tr', {"filter": "applied"}).length == features.length){
										if(app.layers.selectedZipcodeLayer && app.map.hasLayer(app.layers.selectedZipcodeLayer)){
											app.map.removeLayer(app.layers.selectedZipcodeLayer);
											app.layers.selectedZipcodeLayer.clearLayers();
										}
									}else{
										highlightZipcode(zipcodes);
									}
									
								}
							}
						}
					}, 500)
				}
				 
				
			}//end drawCallback
		});// end init dataTable
		
		
		//set all columns in to app.dataTable. Should have another way to get columns
		app.dataTable.columns = dataTable.columns;
		
		
		//add dataTable tools and click event
		var html = "<ul>" +
					//"<li><img src='images/1365859519_cog.png' title='setting'/></li>"+
					//"<li><img src='images/1365858910_download.png' title='download'/></li>" +
					//"<li><img src='images/1365858892_print.png' title='print'/></li>" +
					"<li><img src='images/1365859564_3x3_grid_2.png' title='show / hide columns'/></li>" +
					//"<li><img src='images/1365860337_cube.png' title='canned report'/></li>"+
					//"<li><img src='images/1365860260_chart_bar.png' title='demographic data'/></li>"+
					//"<li><img src='images/1365978110_gallery2.png' title='map gallery'/></li>" +
					//"<li><img src='images/1365872733_sq_br_down.png' title='maximum map'/></li>"+
					"</ul>";
		$(".dataTable_tools").append(html).find("ul li").click(function(){
			//show content in the infobox
			showInfobox($(this).find("img").attr('title'), {
				left: $(this).offset().left - 45,
				top: $(this).offset().top - 25
			}, this);
		});
		
	
		
		//dataTable nav bar
		$(".dataTable_nav").html($("#dataTable_nav").html())
		
		
		//copy dataTable toolbar html to dataTable_control
		$("#dataTable_control").html($(".dataTable_toolbar"));
		
		
		//click on rows
		$("#dataTable tr:not([role='row'])").on({
			click: function(){showLocalInfo($(this).context._DT_RowIndex, {scrollToRow: false,zoomToCenter: true});},
			mouseover: function(){}//showLocalInfo($(this).context._DT_RowIndex, {scrollToRow: false,zoomToCenter: true});}
		});
		
		
		
		//draw Chart
		//add values to the select X and Y
		var html = ""
		$.each(dataTable.columns, function(i, columnName){
			html += "<option>" + columnName + "</option>";
		});
		
		//add events
		var onchange = function(){
			//show chart
			showDataTableChart(obj.json);
		}//end onchange event
		//give the html and onchange event to the selects and trigger change event
		$("#dataTable_chart #select_x").append(html).change(onchange).val("name").change();
		$("#dataTable_chart #select_y").append(html).change(onchange).val(app.geocodingResult.column.statistics).change();
		$(".dataTable_chartType").click(onchange);
		
		
		//show dataTable Panel
		showInfoPanel("dataPanel", $("#menuToolbox ul li:first-child")[0])
		
	}//end createTable	
	
}



//show info box while user click on dataTable tools
function showInfobox(type, css, dom){
	var $dom=$(dom);
	var html=type+"<br><ul>";
	switch(type){
		case "show / hide columns":	
			//get all columns name from table
			$.each(app.dataTable.columns, function(i,columnName){
				//check if the columnName is visible in the dataTable
				var isShow=($(".dataTable th:contains('"+ columnName + "')").length > 0) ? 'checked' : '';
				html+="<li><input type='checkbox' id="+i+" " + isShow + " onclick='app.dataTable.fnSetColumnVis(this.id, this.checked); ColVis.fnRebuild(app.dataTable);' />&nbsp; &nbsp; "+columnName +"</li>";
			});
		break;
		case "demographic data":
			//get all columns name from table
			$.each(app.demographicData, function(k,v){
				html+="<li><input type='radio' name='demographic' value="+k+" onclick='if(this.checked){app.layers.demographicData.redrawStyle(this.value); app.layers.demographicData.addTo(app.map);}' />&nbsp; &nbsp; "+ v +"</li>";
			});
		break;
		case "map gallery":
			var mapGalleries=[
				{label: "marker map", value: "GEOJSON", layerName:"geoJsonLayer"}, 
				{label: "cluster map", value:"MARKERCLUSTER", layerName:"markerClusterLayer"},
				{label: "heat map", value:"HEATMAP", layerName:"heatMapLayer"}
			];
						
			$.each(mapGalleries, function(i,gallery){
				html+="<li><input type='radio' name='mapGallery' value='" + gallery.value + "' " + ((app.geocodingResult[gallery.layerName]._map)?"checked=checked":"") + " onclick='if(this.checked){switchVisualization([this.value]);}' />&nbsp; &nbsp; "+ gallery.label +"</li>";
			});
		break;
		case "canned report":
			var reports=["demographic data report", "social media report"];
			$.each(reports, function(i,report){
				html+="<li><input type='radio' name='mapGallery' value='" + report + "' " + " onclick='' />&nbsp; &nbsp; "+ report +"</li>";
			});
		break;
		case "print":
			window.print();
			return; 
		break;
		
	}	
	html+="</ul>";
	
	$(".dataTable_menu .infobox").html(html);
	$(".dataTable_menu").css(css).show();
}




//show local info
function showLocalInfo(fid, options){
	var layer=app.geocodingResult.geoJsonLayer.layers[fid],
		feature=layer.feature;
	
	//options
	if(!options){options={}}
	options.scrollToRow=options.scrollToRow || false;
	options.zoomToCenter=options.zoomToCenter || false;
	options.showPopup=options.showPopup || false;

	
	//show dataTable panel
	showInfoPanel("dataPanel", $("#menuToolbox li[title='Your Uploaded Data']")[0]);
		
	
	//close popup
	app.map.closePopup();
	
	//scroll to the selected row
	if(options.scrollToRow){
		var rid=feature.properties["_rowID"];
		app.dataTable.fnSettings().oScroller.fnScrollToRow(rid, false);
	}
	
	
	//zoom to the layer, shift lng a little bit to east
	if(options.zoomToCenter){
		var latlng=layer._latlng;
		app.map.setView(new L.LatLng(latlng.lat, latlng.lng-0.0025), 14)
	}
	
	
	//open popup
	if(options.showPopup){
		layer.openPopup();
	}
	
	
	//highlight the tr in the dataTable
	$.each(app.css["dataTable_highlightRow"], function(k,v){app.$tr.css(k,"");});
	app.$tr.closest("[_featureID=" + fid +"]").css(app.css["dataTable_highlightRow"]);
	
	
	//change marker icon
	layer.setIcon(layer.options.iconHover);
		
				
	//trigger businessActions type to directly show the first option and draw its google chart
	$("#businessActions_type").attr("zipcode", feature.properties['zip'])
		
		
		
	//highlight the zipcode boundary and show demographic data
	highlightZipcode([feature.properties['zip']]);
	
	
	//show legend
	var defaultType=$("#demographic_type div[data-role='collapsible'] h3").attr("value");
	//$(".leaflet-control-legend").html(app.layers.demographicData.getLegend(defaultType)).show();
				
					
		
	//select options for social media
	//$select_media
//	var location=app.geojsonReader.read(feature.geometry);
//	var locationX = location.coordinate.x;
//	var locationY = location.coordinate.y;
//	//document.getElementById("lng").value = locationY;
//	//document.getElementById("lat").value = locationX;
//	$("#lng").val(locationY);
//	$("#lat").val(locationX);
//	var $select_media=$("#localInfo_socialMedia");
	//$select_media.html("<br/>Lat: <input type='text' id=lat value=" + locationX + "> <br/>Long: <input type='text' id=lng value=" + locationY + "> <br/>Keyword: <input type='text' id='keyword' value='shoes'><br><button type='button' onclick='callPython()'>Search</button>");
		
	
	
		
	//using jsts jts topology suite to find out the polygon the point is within
//	var point=app.geojsonReader.read(feature.geometry);
//	var polygon, withinLayer;
//	
//	if(app.layers.demographicData){
//		$.each(app.layers.demographicData._layers, function(k,layer){
//			polygon=app.geojsonReader.read(layer.feature.geometry);
//			if(point.within(polygon)){
//				withinLayer=layer;
//				return false; //break the loop
//			}
//		});
//			
//		if(withinLayer){
//			// $select.change(function(){
//				// console.log(withinLayer.feature.properties[this.value]);
//			// });
//		}
//	}
		
}
	
	
	
	
//highlight zipcode area and show zipcodelayer on the map
function highlightZipcode(zipcodes, options){
	if(!options){options={}}
	options.zoomToBounds=options.zoomToBounds || false;
	
	
	var zipcodeLayer=app.layers.selectedZipcodeLayer;
	if(zipcodeLayer && app.map.hasLayer(zipcodeLayer)){
		app.map.removeLayer(zipcodeLayer);
		zipcodeLayer.clearLayers();
	}
	zipcodeLayer=new L.featureGroup();
	$.each(zipcodes, function(i,zipcode){
		zipcodeLayer.addLayer(app.geocodingResult.zipcodeLayer[zipcode]);
	});
	zipcodeLayer.addTo(app.map).bringToBack();
	app.layers.selectedZipcodeLayer=zipcodeLayer;
	
	//zoom to bounds
	if(options.zoomToBounds){
		app.map.fitBounds(zipcodeLayer.getBounds());
	}
}
	




//business action
function showBusinessAction(type){
	var zipcodeLayer=app.geocodingResult.zipcodeLayer,
		selectedZipcode=$("#businessActions_type").attr("zipcode"),
		dataLength=app.geocodingResult.json.features.length;
		dataArray=[],
		sort=[{column: 1, desc:true}],
		//draw chart
		chartOptions={
			googleChartWrapperOptions: {
				chartType: "BarChart",
				containerId: "businessActions_result",
				view:{columns:[0,1]},
				options: {
					width: $(".infoPanel").width()-50,
					height:$(".infoPanel").height()-80,
					title: "",
					titleX: "",
					titleY: "",
					legend: "none",//{position: 'top'},
					chartArea: {width: '65%', height: '85%', top:10},
					fontSize: 11,
					isStacked:true, 
					series:{0:{color: '#5B92C0', visibleInLegend: true}},
					vAxes:{0:{titleTextStyle:{color:"#ffffff"}, textStyle:{color:"#ffffff"}}},
					hAxes:{0:{titleTextStyle:{color: "#ffffff"},textStyle:{color: "#ffffff"}}},
					backgroundColor: {fill:'transparent'},
					tooltip: {isHtml: true},
					is3D:true
				}
			},
			callback:null,
			callback_mouseover:null,
			callback_mouseout:null,
			callback_select:function(e){
				var zipcode=e.data.getValue(e.row, 0);
				showDemographicData(zipcode);
			}
		}
		
		
		switch(type){
			case "top_users":
				dataArray = new google.visualization.DataTable();
				dataArray.addColumn('string', "zipcodes");
				dataArray.addColumn('number', "customers");
				dataArray.addColumn({type:'string', role:'tooltip', 'p': {'html': true}});
				dataArray.addColumn('number', "highlight");
				dataArray.addColumn({type:'string', role:'tooltip', 'p': {'html': true}});
				dataArray.addColumn('number', "originalCustomers"); // the original customer number for sorting. But this value will be devided by total number (dataLength) for better presentation
				
				var highlight=0, count=0, tooltip="", originalCount=0;
				$.each(zipcodeLayer, function(k,v){
					originalCount=v.feature.properties["extra-count"];
					highlight=0;
					count=originalCount;
					
					if(k==selectedZipcode){
						highlight=originalCount;
						count=0; //in order to highlight this zipcode bar, the customers number should be set as 0 to show the highlight bar.
					}
					
					tooltip="<div id='chartTooltip'><b>Zipcode: </b>" + k + "<br><b>Customers: </b>"+ originalCount + " ("+ (((originalCount/dataLength).toFixed(4))*100)+ "%)</div>";
					dataArray.addRow([k, count, tooltip, highlight, tooltip, originalCount/dataLength]);
					
					//show zipcode layer
					//v.addTo(app.map);
				});
				
				sort=[{column: 5, desc:true}] //according column 5 (orginalCustomers) to sort whole datasets.
				
				//chartOptions
				chartOptions.googleChartWrapperOptions.options.series[1]={color: '#ED3D86', visibleInLegend: false}; //set bar color=pink for highlight
				chartOptions.googleChartWrapperOptions.options.series[2]={color: 'transparent', visibleInLegend: false}; //set bar color=transparent for originalCustomers
				chartOptions.googleChartWrapperOptions.options.titleX="The number of customers";
				chartOptions.googleChartWrapperOptions.options.titleY="Zip Codes"
			break;
			case "top_sales":
				var columnName=app.geocodingResult.column.statistics;
				dataArray=[["zipcodes", "sum_"+columnName+""]];
				$.each(zipcodeLayer, function(k,v){dataArray.push([k, v.feature.properties["extra-" + columnName +"_sum"]]);});
				chartOptions.googleChartWrapperOptions.options.titleX="The sum of "+columnName;
				chartOptions.googleChartWrapperOptions.options.titleY="Zip Codes"
			break;
			case "avg_income_from_users":
				
			break;
			case "most_language_from_users":
				
			break;
			case "potential_market":
				
			break;
		}
		
		
		pathgeo.service.drawGoogleChart(dataArray, [chartOptions], null, null, {sort:sort}); //sort, but the sequence of the chart data will be different with the geojson		
}




//show demographic Data
function showDemographicData(zipcode){
		var html_listview="",
			html_collapsible="",
			properties=app.layers.demographicData.zipcodes[zipcode].feature.properties;
				
		//show localinfor panel
		showInfoPanel("localInfoPanel", $("#menuToolbox li[title='Find the Best Business Actions']")[0]);
		
		//set zipcode attribute in the select_businessAction
		$("#businessActions_type").attr('zipcode', zipcode).change();
		
		
		//header
		$("#businessActions_detailTitle").text(properties["NAME"]);
		
		
		//highlight zipcode
		highlightZipcode([zipcode], {zoomToBounds:true});
		
		
		//CONTENT
		var html_higher="<div data-role='collapsible' data-collapsed='false' data-theme='b' data-content-theme='d' data-collapsed-icon='arrow-d' data-expanded-icon='arrow-u' data-iconpos='right'>"+
						"<h4>Higher than the average</h4><ul data-role='listview' data-divider-theme='d'>";
		var html_lower="<div data-role='collapsible'  data-theme='b' data-content-theme='d' data-collapsed-icon='arrow-d' data-expanded-icon='arrow-u' data-iconpos='right'>"+
						"<h4>Lower than the average</h4><ul data-role='listview' data-divider-theme='d'>";
		$.each(properties, function(k,prop){
			if(k.split("extra-").length==1){ // only show origianl properties without extra properties
				//list view
				if(k=='ZIP' || k=='NAME' || k=='STABB' || k=='AREA' || k=='id1'){
					if(k=='ZIP' || k=='NAME'){
						html_listview+="<li><h4>"+ k + "<p>" + prop + "</p></h4></li>";
					}
				}else{
//					html_collapsible+="<div data-role='collapsible' data-theme='c' data-content-theme='d' data-collapsed-icon='arrow-d' data-expanded-icon='arrow-u' data-iconpos='right'>" + 
//					  				 	"<h4 value='" + k + "'>"+ app.demographicData[k] + "<p>" + prop + "</p></h4>"+
//									 	"<div id='demographicChart_" + k + "' class='demographicChart'></div>" +
//									  "</div>";
					
					//classify demographic data to advantage (value >= average of CA) and disadvantage (value< average)
					if(prop >= app.properties_average[k]){
						html_higher+="<li><a href=# value='"+ k + "'><img src='images/1369780713_navigation-up_red.png'><h2>"+ app.demographicData[k] + "</h2><p><label>"+ prop +"</label> > " + app.properties_average[k] + "</p></a></li>";
					}else{
						html_lower+="<li><a href=# value='"+ k + "'><img src='images/1369780924_navigation-down_green.png'><h2>"+ app.demographicData[k] + "</h2><p><label>"+ prop +"</label> < " + app.properties_average[k] + "</p></a></li>";
					}
				}
				//html+="<li><a href='#'><img src='images/1368477544_FootballPlayer_Male_Dark.png'><p>" + k + "</p><h2>" + prop + "</h2></a></li>";
			}
		});
		
		//html for collapsible layout
		html_higher+="</ul></div>";
		html_lower+="</ul></div>";
		html_collapsible=html_higher + html_lower;
		//html_collapsible+="</div>";

		//add some properties in the zipcode layer
		var zipcodeLayerProperties=app.geocodingResult.zipcodeLayer[zipcode].feature.properties;
		html_listview+="<li><h4>Total Customers<p>"+zipcodeLayerProperties['extra-count']+"</p></h4></li>"+
					   "<li><h4>Total "+ app.geocodingResult.column.statistics +"<p>"+zipcodeLayerProperties['extra-'+app.geocodingResult.column.statistics+'_sum']+"</p></h4></li>"+
					   "<ul>";
		
				
		$("#businessActions_detailContent_listview").html(html_listview).listview('refresh');
		$("#businessActions_detailContent_collapsible").html(html_collapsible).trigger('create');
				
		//expand events
		$('#businessActions_detailContent_collapsible div.ui-btn-inner a').on('click', function(e,ui){
			//show demographic layer on the map
				if(app.layers.demographicData){
					var demographic=app.layers.demographicData,
						type=$(this).attr('value');
					
					//highlight the zipcode boundary
					demographic.redrawStyle(type, function(f){
						var defaultStyle=demographic.options.styles(f, type);
					
						if(f.properties["ZIP"]==zipcode){
							defaultStyle.width=4;
							defaultStyle.color="#666";
							defaultStyle.dashArray='';
						}
							
						console.log(defaultStyle)
						return defaultStyle;
					})
							
					demographic.addTo(app.map); 		
							
					//change legend
					$(".leaflet-control-legend").html(demographic.getLegend(type));
				}
		})
		
		
		$('#businessActions_detailContent_collapsible div.ui-collapsible h4').on('click', function(e,ui){
			//do only when expand
			if(!$(this).hasClass('ui-collapsible-heading-collapsed')){
				var type=$(this).attr('value'),
					domID='demographicChart_'+type;
							
				//showDemographicChart(type, zipcode, domID);
			}
		});
								
								
		//trigger dataTable to filter the zipcode
		//app.dataTable.fnFilter(zipcode);

		//show the detail of business actions
		$(".businessActions_tabs").hide();
		$("#businessActions_detail").show();
	
}



//show demographic data chart
function showDemographicChart(type, zipcode, domID){
	var chartData=[["type", "value"]];
	chartData.push([String(zipcode), app.properties[zipcode][type]]);
	chartData.push(['CA Average', app.properties_average[type]]);
	
	var chartOptions={
		googleChartWrapperOptions: {
			chartType: "ColumnChart",
			containerId: domID,
			view:{columns:[0,1]},
			options: {
				width: $("#"+domID).width(),
				height: $("#"+domID).height(),
				title: "",
				titleX: "Type",
				titleY: "Value",
				legend: "none",
//				vAxes:{0:{titleTextStyle:{color:"#ffffff"}, textStyle:{color:"#ffffff"}}},
//				hAxes:{0:{titleTextStyle:{color: "#ffffff"},textStyle:{color: "#ffffff"}}},
				backgroundColor: {fill:'transparent'}
			}
		},
		callback:null,
		callback_mouseover:null,
		callback_mouseout:null,
		callback_select:function(obj){
			console.log(obj)
		}
	};
	
	//drawChart
	pathgeo.service.drawGoogleChart(chartData, [chartOptions], null, null);
}




//show chart in the dataTable
function showDataTableChart(geojson){
	var x=$("#dataTable_chart #select_x").val(),
		y=$("#dataTable_chart #select_y").val(),
		type=$(".dataTable_chartType:checked").val();
	
	if(!x || !y){
		alert("Please select the x and y axis first");
		return;
	}
	
	if(x=='none' || y=='none'){return;}
			
	
	//draw chart
	var chartOptions={
		googleChartWrapperOptions: {
			chartType: type,
			containerId: "dataTable_chartContent",
			view:{columns:[0,1]},
			options: {
				width: $(".infoPanel").width()-20,
				height: geojson.features.length*30,
				title: "",
				titleX: x,
				titleY: y,
				legend: {position: 'top'},
				chartArea: {width: '', height: '90%', top:20},
				fontSize: 11,
				vAxes:{0:{titleTextStyle:{color:"#ffffff"}, textStyle:{color:"#ffffff"}}},
				hAxes:{0:{titleTextStyle:{color: "#ffffff"},textStyle:{color: "#ffffff"}}},
				backgroundColor: {fill:'transparent'}
			}
		},
		callback:null,
		callback_mouseover:function(obj){
			showLocalInfo(obj.value.properties._featureID, {scrollToRow:true, zoomToCenter:true, showPopup:true})
		},
		callback_mouseout:null,
		callback_select:function(obj){
			showLocalInfo(obj.value.properties._featureID, {scrollToRow:true, zoomToCenter:true, showPopup:true})
		}
	};
	//pathgeo.service.drawGoogleChart(geojson, [chartOptions], [x, y], null, {sort:[{column: 1}]}); //sort, but the sequence of the chart data will be different with the geojson
	pathgeo.service.drawGoogleChart(geojson, [chartOptions], [x, y], null);

}




//show chart in the localInfo
function showLocalInfoChart(data, containerId){
	var chartOptions={
		googleChartWrapperOptions: {
			chartType: "ColumnChart",
			//containerId: "localInfo_chart",
			containerId: containerId,
			view:{columns:[0,1]},
			options: {
				width: 300,
				height: 200,
				title: "",
				titleX: "",
				titleY: "",
				legend: "",
				vAxes:{0:{titleTextStyle:{color:"#ffffff"}, textStyle:{color:"#ffffff"}}},
				hAxes:{0:{titleTextStyle:{color: "#ffffff"},textStyle:{color: "#ffffff"}}},
				backgroundColor: {fill:'transparent'}
			}
		},
		callback:null,
		callback_mouseover:null,
		callback_mouseout:null,
		callback_select:function(obj){
			console.log(obj)
		}
	};
	pathgeo.service.drawGoogleChart(data, [chartOptions], null, null);
}



//show zipcode chart
//when user click on the zipcode layer on the map
function showZipcodeChart(domID, zipcode, value, totalValue){
	var chartOptions={
		googleChartWrapperOptions: {
			chartType: "PieChart",
			containerId: domID,
			view:{columns:[0,1]},
			options: {
				width: 300,
				height: 200,
				title: "",
				titleX: "",
				titleY: "",
				legend: "",
				backgroundColor: {fill:'transparent'}
			}
		},
		callback:null,
		callback_mouseover:null,
		callback_mouseout:null,
		callback_select:null
	};
	
	var data=[
		["zipcode", "value"],
		[zipcode, value],
		["others", totalValue-value]
	];
	
	setTimeout(function(){
		pathgeo.service.drawGoogleChart(data, [chartOptions], null, null);
	},10);
}




//****************************************************************************************************
var curLayer;
var curData = [];


//Work in Progrss... social media viewing
function callPython(inputValue, demoOptions){
	//show loading
	$("#socialMedia_loading").show();
	
	//var keywordTemp = document.getElementById("socialMedia_keyword").value;
	var keywordTemp='',
		location="";
	
	if(inputValue.split("@").length>1){
		keywordTemp=inputValue.split("@")[0];
		location=inputValue.split("@")[1];
		
		//lookup geonames for the coordinates of the location
		pathgeo.service.geonameLookup(location, function(lat, lng, json,error){
			if(error){alert("Sorry, we cannot locate to the '"+location+"'. Please search again!");return;}
			
			app.map.setView(new L.LatLng(lat, lng), 10);
			setTimeout(search, 1000);
		});
	}else{
		keywordTemp=inputValue;
		search();
	}
	
	
	
	function search(){
		var keywordArray = keywordTemp.split(" ");
		var keyword = keywordArray[0];
		for (i = 1; i < keywordArray.length; i++) {
			keyword = keyword + "+" + keywordArray[i];
		}
		
		//	var lat = document.getElementById("lat").value;
		//	var lng = document.getElementById("lng").value;
		//try to get the center latlng of the map view
		var center = app.map.getCenter();
		lat = center.lat;
		lng = center.lng;
	
		
		var rad = 18;
		var ts = (Math.floor(Date.now() / 1000)) - (63072000);
		var source = $("#socialMedia_search .ui-radio .ui-btn-active").siblings('input').val() || "twitter";
			source =(demoOptions && demoOptions.source && demoOptions.source!='') ? demoOptions.source : source;

		var obj = {
			twitter: {
				url: (demoOptions && demoOptions.url && demoOptions.url!='')?demoOptions.url:"python/twitter_search.py", //"db/demo-twitter.json",//
				data: {
					kwd: keyword,
					lat: lat,
					lng: lng,
					rad: rad,
					ts: ts
				},
				readData: function(features){
					var title, description, image, date, account, html = "";
					$.each(features, function(i, feature){
						title = feature.properties.Title;
						image = feature.properties.Img;
						date = feature.properties.Date;
						account = feature.properties.Account;
						
						//highlight keyword in the content
						title=pathgeo.util.highlightKeyword([inputValue],title,true);
						
						html += "<li id='"+ i +"'><a hrsef='#'><img src='" + image + "'/><h2>" + account + "</h2><p class='socialMedia_description'>" + title + "</p><p class='ui-li-aside'><strong>" + date.split(" ")[0] + "</strong></p></a><a href='http://twitter.com/" + account + "' target='_blank'>Go to this Tweet</a></li>";
					});
					return html;
				}
			},
			flickr: {
				url: (demoOptions && demoOptions.url && demoOptions.url!='')?demoOptions.url:"python/photo_search.py",//"db/demo-flickr.json", //
				data: {
					kwd: keyword,
					lat: lat,
					lng: lng,
					rad: rad,
					ts: ts
				},
				readData: function(features){
					var title, description, image, date, account, html = "";
					$.each(features, function(i, feature){
						title = feature.properties.Title;
						description = feature.properties.Description;
						image = feature.properties.Img;
						date = feature.properties.Date;
						account = feature.properties.Account;
						
						//highlight keyword in the content
						title=pathgeo.util.highlightKeyword([inputValue],title,true);
						
						html += "<li id='"+ i +"'><a href='#'><img src='" + image + "'/><h2>" + $(account).html() + "</h2><p class='socialMedia_description'>" + title + "</p><p class='ui-li-aside'><strong>" + date.split(" ")[0] + "</strong></p></a>" + account + "</li>";
					});
					return html;
				}
			}
		}
		
		console.log(obj)
		console.log(lat);
		console.log(lng);
		console.log(keyword);
		console.log(source);

		//ajax
		if (obj[source]) {
			var o = obj[source];
			
			$.ajax({
				type: "GET",
				url: o.url,
				data: o.data,
				beforeSend: function(xhr){if (xhr.overrideMimeType) {xhr.overrideMimeType("application/json");}},
				success: function(contact){
					if (curLayer && app.map.hasLayer(curLayer)){
						app.map.removeLayer(curLayer);
					}
						
					if (contact.length == 0 || !contact) {
						$('#search_results').html('');
						$("#layer_selector, #socialMedia_loading").hide();
						alert("No results were found. Please use another keywords or remove location (ex: @) to try again.");
					}else {
						//remove layers
						var layerNames=["geoJsonLayer", "markerClusterLayer", "heatMapLayer", "maskCanvasLayer"],
							showLayerNames=[];
						$.each(layerNames, function(i,layerName){
							var layer=app.socialMediaResult[layerName];
							if(layer){
								//if layer._map has map object, that means the layer is shown in the map
								if(layer._map){
									//showLayerNames.push(layerName);
									app.map.removeLayer(layer);
								}
								app.controls.toc.removeLayer(layer);
							}
						});
						
						//remove class in the map gallery
						$('.leaflet-control-mapGallery li[layer="geoJsonLayer"]').css({"background-color": '#5B92C0'}).siblings('li').css({"background-color": ''});
						
					
						//create layer
						app.socialMediaResult={
							type:"GEOJSON",
							url: null,
							json: {
								type:"FeatureCollection",
								features:contact
							},
							column:{
								statistics:""
							},
							keywords:inputValue,
							title: "[" + source + "] " + keyword,
							source: source
						}
						showLayer(app.socialMediaResult,true);
						
						
						//append source header in the listview
						$("#search_results").html('')
											.append("<li data-role='list-divider'>" + source + "<span class='ui-li-count'>" + contact.length + "</span></li>")
											.append(o.readData(contact))
											.trigger('create').listview('refresh')
											.prev().on("keyup",function(){   //if do filter by inputting some keytwords, the count will automatically change
										    	var count=$("#search_results li:visible").length-1;
												$("#search_results .ui-li-count").html(count);
										    });
						
						//while clicking on each li in the search_reuslts ul
						$('#search_results li').on({
							click:function(e){
								var $this=$(this),
									id=$this.attr('id'),
									layer=app.socialMediaResult.geoJsonLayer.layers[id];	
								layer.openPopup();	
							}
						})
						
						$("#point_media").addClass("ui-btn-active");
						$("#heat_media").removeClass("ui-btn-active");
						$("#cluster_media").removeClass("ui-btn-active");
						
						$("#socialMedia_result, #socialMedia_mapType").show();
						$("#socialMedia_loading").hide();
						
						//setDataMedia(contact);
						//app.map.fitBounds(curLayer.getBounds());
					}
				},
				failure: function(error){
					console.log(error);
					alert("There was an error in your search. Please try again");
					$("#socialMedia_loading").hide();
				}
			});
		}else {
			console.log('[ERROR] callPython: ' + source + ' is not recognized!');
		}
		
	}//end search function
}




function getClusterLayerMedia(gjData) {
	var clusterLayer = new L.MarkerClusterGroup({ 
		spiderfyOnMaxZoom: false, 
		showCoverageOnHover: true, 
		zoomToBoundsOnClick: false,
		iconCreateFunction: function(cluster) {
			//return new L.DivIcon({ html: cluster.getChildCount(), className: 'mycluster', iconSize: new L.Point() });
			var count = cluster.getChildCount();
			if(curData[0].properties.Source == "twitter"){
				var image = "newTweet";
			}
			else{
				var image = "newPhoto";
			}
			
			var amount = cluster.getChildCount();
			if (amount >=10){
				var icon = "<b style='position:absolute; left:2px; top:0px; color:white'>" + count + "</b><img border='0' src='images/" + image + ".png' width='62' height='74'>";
			}
			else if (amount >=5){
				var icon = "<b style='position:absolute; left:2px; top:0px; color:white'>" + count + "</b><img border='0' src='images/" + image + ".png'  width='50' height='61'>";
			}
			else{
				var icon = "<b style='position:absolute; left:2px; top:0px; color:white; font-size: 10px'>" + count + "</b><img border='0' src='images/" + image + ".png'>";
			}
	
			return new L.DivIcon({ html: icon, className: 'mycluster' });
		}
	});
	
	
	clusterLayer.on('clusterclick', function (e) {
		if(!e.layer._popup) {
			//Use tables to align everything???
			var properties = pathgeo.util.readClusterFeatureProperies(e.layer, []);
			var html = "<div class='popup'><p style='font-weight: 900;'>There are " + e.layer._childCount + " addresses:</p><ul>";
			$.each(properties, function(i, property){
				if (property.Source == "flickr") {
					html += "<li><span class='ui-icon ui-icon-circle-plus iconExpand' style='display:inline-block'></span><span class='clusterInfo'>" + property.Title + "</span><br><div class='extras' style='margin-bottom: 30px;'><img src='" + property.Img + "' alt='...' style='float:left; margin-right:5px'><div class='extras' style='display: block;'> " + property.Account + "<br/><br/>" + property.Date + "</div></li>";
				}
				else {
					html += "<li><span class='ui-icon ui-icon-circle-plus iconExpand' style='display:inline-block'></span><span class='clusterInfo'>" + property.Title + "</span><br><div class='extras' style='margin-bottom: 10px;'><img src='" + property.Img + "' alt='...' style='float:left; margin-right:5px'><div class='extras' style='display: block;'><a href='http://twitter.com/" + property.Account + "' target='_blank'>" + property.Account + "</a><br/><br/>" + property.Date + "</div></li>";
				}
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
	
	
	clusterLayer.addLayer(getPointLayerMedia(gjData));
	
	return clusterLayer;
}


//Excpects an array of geoJson features
function getPointLayerMedia(gjData) { 
	var pointLayer = new L.geoJson([], {
		onEachFeature: function (feature, layer) {
			var props = feature.properties;
			if (props.Source == "flickr"){
				var html = "<div class='popup'><ul><li><span class='clusterInfo'>" + props.Title + "</span><br/><img src='" + props.Img + "' alt='...' style='float:left; margin-right:5px'><div class='extras' style='display: block; padding-bottom:20px'> " + props.Account + "<br/><br/>" + props.Date + "</li></ul></div>";
			}
			else {
				var html = "<div class='popup'><ul><li><span class='clusterInfo'>" + props.Title + "</span><br/><img src='" + props.Img + "' alt='...' style='float:left; margin-right:5px'><div class='extras' style='display: block;'><a href='http://twitter.com/" + props.Account + "' target='_blank'>" + props.Account + "</a><br/><br/>" + props.Date + "</li></ul></div>";
			}
			layer.bindPopup(html);
		}, 	pointToLayer: function (feature, latlng) {
		
			var props = feature.properties;
			var url;
			if (props.Source == "flickr"){
				url = "images/newPhoto.png";
			}
			else {
				url = "images/newTweet.png";
			}
		
			var icon = L.icon({ 
				iconUrl: url,
				popupAnchor: [1, 1]
			});

			marker = L.marker(latlng, {icon: icon});
			return marker; 
		}  
	});
	
	for (var indx in gjData) {
		pointLayer.addData(gjData[indx]);
	}
	
	return pointLayer;
}

function getHeatmapLayerMedia(gjData) {
	var heatmapLayerMedia = new L.TileLayer.heatMap({ 
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
	
	var heatmapDataMedia = [];
	
	for (var indx in gjData) {
		heatmapDataMedia.push( { lat: gjData[indx].geometry.coordinates[1], lon: gjData[indx].geometry.coordinates[0], value: 1 } );
	}
	heatmapLayerMedia.setData(heatmapDataMedia);
	return heatmapLayerMedia;
}

function switchLayersMedia(newLayerName) { 
	if (curLayer && app.map.hasLayer(curLayer)) {
		app.map.removeLayer(curLayer);
		curLayer=null;
	}
	
	
	if (newLayerName == "heatmap") {
		//curLayer = getHeatmapLayerMedia(curData);
		console.log(curData)
		curLayer=pathgeo.layer.heatMap(curData, 100, {opacity:0.65});
		curLayer.addTo(app.map).bringToFront();
	} else if (newLayerName == "point") { 
		curLayer = getPointLayerMedia(curData);
		app.map.addLayer(curLayer);
	} else if (newLayerName == "cluster") { 
		curLayer = getClusterLayerMedia(curData);
		app.map.addLayer(curLayer);
	} else if (newLayerName == "census") {
		enableCensusLayer();
		curLayer = getPointLayerMedia(curData);
		app.map.addLayer(curLayer);
	}
}


function setDataMedia(data) {
	curData = data;
	switchLayersMedia("point");
}


function filterResults(){
	var keyword = String(document.getElementById("search").value);
	
	var count = curData.length;
	var newCount = 0;
	$("#search_results").html('');
	//$('#social_results_count').html("There are <b>" + count + "</b> results<br/>Seacrh: <input type='text' name='search' id='search' value='' onkeyup='filterResults()'>");

	for(i=0; i<count; i++){
	
		if(curData[i].properties.Source == "flickr"){
		
			var title = String(curData[i].properties.Title);
			var n1=title.search(keyword);
			
			var description = curData[i].properties.Description;
			var n2=description.search(keyword);
			
			var account = curData[i].properties.Account;
			var image = curData[i].properties.Img;
			var date = curData[i].properties.Date;

			
			if(n1>=0 || n2>=0){
				var results = "<li><h2>" + title + "</h2><img src='" + image + "' alt='...' style='float:left; margin-right:5px'>" + account + "<br/><p>" + date + "</p><br/></li>";
				$("#search_results").append(results);
				newCount++;
			}
		}
		
		else {
			var title = curData[i].properties.Title;
			var n1=title.search(keyword);
			
			var image = curData[i].properties.Img;
			var date = curData[i].properties.Date;
			var account = curData[i].properties.Account;

			
			if(n1>=0){
				var results = "<li><h2>" + title + "</h2><img  src=" + image + " alt='...' style='float:left; margin-right:5px'><a href='http://twitter.com/" + account + "' target='_blank'>@" + account + "</a><br/><p>" + date + "</p><br/></li>";
				$("#search_results").append(results);
				newCount++;
			}
		}
		
		$("#search_results_count").html('');
		$('#social_results_count').html("There are <b>" + newCount + "</b> results<br/>");
		$('#search_results').trigger('create');
		$('#search_results').listview('refresh');
	}

}
//****************************************************************************************************








//search business Intelligent
function searchBusinessIntelligent(geoname){
	console.log(geoname);
}




//show demo
function showDemo(demoType, dom){
	var keyword=demoType.split("@")[0],
		source=demoType.split("@")[1],
		url=$(dom).attr("url");
	callPython(keyword, {source:source, url:url});
	$("#dialog_menu").popup("close");
	showInfoPanel("socialMediaPanel", $("#menuToolbox ul li[title='Search Social Media']")[0]);
}



//show infoPanel
function showInfoPanel(domID, obj){
	//change obj's background color
	$("#menuToolbox ul li").css("background", "");
	$(obj).css('background', "rgba(255,255,255,0.3)")

	
	//hide other infoPanels
	$(".infoPanel").hide();
	
	
	//show infoPanel	
	$("#"+domID).show();
	
	
	//resize map
	var width=($("#content").width() - $(".infoPanel").width() - $("#menuToolbox").width() - 20) / $("#content").width() * 100;
	$("#div_map").css({width:width+"%"});
	app.map.invalidateSize(false);
}



//close infoPanel
function closeInfoPanel(){
	//cancel obj's background color
	$("#menuToolbox ul li").css("background", "");
	
	
	$(".infoPanel").hide();
	
	//resize map
	$("#div_map").css({width:'100%'});
	app.map.invalidateSize(false);
}




function showDialog(dom_id){
	$("#"+dom_id).popup("open");
}


//fake function for login
function fakeLogin(){
	$("#usermenu_list").show();
    $("#user_login").hide();                
}

