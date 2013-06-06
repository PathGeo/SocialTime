//Load Google Charts and set callback
google.load("visualization", "1", {packages:["corechart", "table"]});

//var locationY;
//var locationX;

var app={
	map:null,
	basemaps:{
			"Cloudmade": L.tileLayer("http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/{styleId}/256/{z}/{x}/{y}.png", {styleId: 22677}),
			"OpenStreetMap": L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
			"Google Streetmap":L.tileLayer("https://mts{s}.googleapis.com/vt?lyrs=m@207265067&src=apiv3&hl=zh-TW&x={x}&y={y}&z={z}&s=Ga&style=api%7Csmartmaps",{subdomains:"123", attribution:"Map Source from Google"})
	},
	layers: {
			"demographicData":null
	},
	geocodingResult:{
			type:"GEOJSON",
			url: null,
			title: null,
			keywords:[]
	},
	controls:{
		mapGallery: L.Control.extend({
		    options: {collapsed: true,position: 'bottomright',text: 'Map Gallery',},
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
					        		layer=app.geocodingResult[value];
					        	
					        	//if this layer is already shown on the map, hide the layer and change the color
					        	if(layer._map){
					        		app.map.removeLayer(layer);
					        		$this.css({"background-color": ''});
					        	}else{
					        		layer.addTo(app.map);
					        		$this.css({"background-color": '#5B92C0'});
					        	}
					        });
		        
		        return container
		    }
		}),
		toc:null,
		legend: L.Control.extend({
		    options: {position: 'topright',text: 'Legend',},
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
		/*"HC01_VC04":"Total Population",
		"HC01_VC20":"Total population with children at home ",
		"HC01_VC21":"Median household income (dollars)",
		"HC01_VC23":"Employed Population 16 years and over",
		"HC01_VC28":"Average household size",
		"HC01_VC74":"Age",
		"HC01_VC85":"Sex",
		"HC01_VC86":"Public Health"*/
		//"HC01_VC112":"Median family income",
		//"HC01_VC113":"Mean family income",
		//"HC01_VC115":"Per capita income"		
	},
	geojsonReader: new jsts.io.GeoJSONReader(),
	mapGalleryHtml:"",
	css:{
		"dataTable_highlightRow":{"background-color":"#ED3D86", "color":"#ffffff"}
	}
}




//init
$(document).on("pageshow", function(){	  
	init_UI();
   
   	init_map();
	
	pathgeo.service.zipcodeLookup(91745, function(placename, json, status){
		if(!status) {
			if(placename != '') {
							
			}
		}
		
	});

});





//init openlayers
function init_map(){
	//adjust map height
	//var map_height=((($(document).height()-$("#header").height()) / $(document).height())*100*0.45)+"%";
	//$("#div_map").css({height:300});
	
	app.map = L.map("div_map", {
        center: app.initCenterLatLng,
		zoom: app.initCenterZoom,
		layers:[app.basemaps["Cloudmade"]],
		attributionControl:false,
		trackResize:true
    }); 
	
	//move the location of zoomcontrol to the bottom right
	app.map.zoomControl.setPosition("bottomright");
	
	//layers control
	app.controls.toc=L.control.layers(app.basemaps).setPosition("bottomright");

	//map gallery control
	$.each(app.controls, function(k,v){
		//toc is hidden in the map
		if(k=="toc"){
			app.map.addControl(v);
		}else{
			app.map.addControl(new v());
		}
	});
	
	
	//create maxminMap DIV
	$("#div_map").append("<div id='showhideTable' title='Hide Table'>Hide Table</div>");
	
	//maximum or mimimum map
	$("#showhideTable").click(function(){
		var $this=$(this);
		
		//maximum map
		if($this.html()=='Hide Table'){
			$("#div_map").animate({height:"80%"}, 500, function(){
				//resize map
				app.map.invalidateSize(false);
				
				$("#dataPanel").css({height:"17%"});
	
				$this.html("Show Table").attr("title", "Show Table");
			});
		}else{
			$("#div_map").animate({height:"53%"}, 500, function(){
				//resize map
				app.map.invalidateSize(false);
				
				$("#dataPanel").css({height:"45%"});
	
				$this.html("Hide Table").attr("title", "Hide Table");
			});
		}
	}).trigger('click');
	
	
	//read demographic data
	pathgeo.service.demographicData({
		// filter:{
			// type:"zipcode",
			// value:"94131"
		// },
		callback:function(geojsonLayer){
			app.layers.demographicData=geojsonLayer;
			
			//showDemo data
			showDemo('SAN FRANCISCO');
		}
	});
	//alert(app.layers.demographicData.toSource());
	//alert(pathgeo.service.demographicData.toSource());

}



//init UI
function init_UI(){
	
	//content height
	$("#content").height($(window).height()-$("#header").height());
	
	$("#div_gallery ul li").click(function(){
		$(this).css("background-color", "#222222").siblings().css("background-color","");
	});
	
	
	//init popup
	//$("div[data-role='popup']").popup();
	

	//show main menu
	//if directly show the main menu while initlizing the webpage, the main menu will be immediately disppeared in Chrome (noraml in the Firefo).
	//JQM said this is the bug from webkit(Goolge chrome) https://github.com/jquery/jquery-mobile/issues/5775
	setTimeout(function(){
		$("#dialog_menu").popup("open");
	},1000);
	
	//dataFilter
//	$("#dataFilter").css({"margin-top":$("#div_map").height()}).find(">ul li").click(function(){
//		$(this).find("span").toggle();
//	})
	
	//adjust dataPanel
	//$("#dataPanel").css({"margin-top":$("#div_map").height()+10, height: $(document).height()-$("#div_map").height()-$("#header").height()-30});
	
	//adjust localInfo
	$("#localInfo").css({height:$("#content").height()-30});
	
	
	
	//when window resize
	$(window).resize(function(){
		$("#content").height($(window).height()-$("#header").height());
		$("#localInfo").css({height:$("#content").height()-30});
	})
	
	
	//when mouse click on otherplace, hide dataTable_menu
	$(document).mouseup(function(e){
		var $container=$(".dataTable_menu, #dataTable_chartControlMenu");
		if(!$container.is(e.target) && $container.has(e.target).length===0){
			$container.hide();
		}
	});
	
	
	//businessActions selection change
	$("#businessActions_type").change(function(){
		showBusinessAction(this.value);
	})
	
	
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
								
				$("#uploadData_description").hide();
				$("#uploadData_confirm").show();
				$("#uploadData_controls").show();	
				
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
		
		$.ajax({
			dataType: 'json',
			url: "retrieveAndGeocode.py", 
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
					
					//hide loadData dialog
					$("#dialog_uploadData").popup("close");
				}
				
				
				
				//parse geojson
				function parseGeojson(obj){
					//remove layers
					var layerNames=["geoJsonLayer", "markerClusterLayer", "heatMapLayer"],
						showLayerNames=[];
					$.each(layerNames, function(i,layerName){
						var layer=obj[layerName];
						if(layer){
							//if layer._map has map object, that means the layer is shown in the map
							if(layer._map){
								showLayerNames.push(layerName);
								app.map.removeLayer(layer);
							}
							app.controls.toc.removeLayer(layer);
						}
					});
					
				
					var layers=[], 
						zipcodes={};
					
					
					//marker layer
					obj.geoJsonLayer = new L.geoJson(obj.json, {
								onEachFeature:function(feature,layer){
									var html=pathgeo.util.objectToHtml(feature.properties);
									
									//highlight keyword
									html=pathgeo.util.highlightKeyword(obj.keywords,html);
									
									//info window
									//layer.bindPopup(html,{maxWidth:500, maxHeight:300});
									
								
									//based on _DT_RowIndex to insert layer into layers
									//That means it is the geocoding layer
									if(feature.properties._DT_RowIndex>=0){
										var id=feature.properties["_DT_RowIndex"];
										layers[id]=layer;
										
										//if feature contains zipcode field, then calculate information in the feature attribute, e.g. how many users in the zip code, the sum of sales
										if(feature.properties["zip"]){
											var code=feature.properties["zip"],
												sales=feature.properties["sales"];
											
											if(zipcodes[code]){
												var properties=zipcodes[code].feature.properties;
												properties["extra-ids"].push(id);
												properties["extra-count"]=properties["extra-ids"].length;
												properties["extra-sales_sum"]=properties["extra-sales_sum"] + sales;
											}else{
												//assign zipcode layer in the demographic layer to the zipcodes array
												var zipcodeLayer=app.layers.demographicData.zipcodes[code],
													properties=zipcodeLayer.feature.properties;
													
												properties["extra-ids"]=[id];
												properties["extra-count"]=0;
												properties["extra-sales_sum"]=sales;
												
												zipcodes[code]=zipcodeLayer;
											}
										}
									}
									
									
									//default icon
									layer.defaultIcon=layer.options.icon;
								
									
									//event
									layer.on({
										mouseover: function(e){
											
										},
										mouseout: function(e){
											obj.geoJsonLayer.resetStyle(e.target);
										},
										click:function(e){
											//show local info
											showLocalInfo(e.target.feature.properties._DT_RowIndex, true);
										}
									})
								},
								
								//style
								style:{},
								
								//pointToLayer to change layers' icon
								pointToLayer: function(feature, latlng){
									var icon=new L.icon({
											iconUrl: "images/marker-icon.png",
											iconSize: [12.5, 21],
											iconAnchor: [6.25, 10.5]
									});
									return new L.marker(latlng, {icon: icon})
								}
					});
					obj.geoJsonLayer.layers=layers;

					
					//zipcodes
					obj.zipcodeLayer=zipcodes;
					
					
					//add geojsonlayer to toc
					app.controls.toc.addOverlay(obj.geoJsonLayer, "Marker Map");
					

					//markercluster layer
					obj.markerClusterLayer = pathgeo.layer.markerCluster(obj.json, {
								onEachFeature: function (feature, layer) {
									var props = feature.properties;
//									var popupText = '';
//									
//									for (var prop in props) { 
//										var fieldName = prop.charAt(0).toUpperCase() + prop.slice(1);
//										
//										if (fieldName.toLowerCase() != "loc") {
//											popupText += "<b>" + fieldName + "</b>: " + feature.properties[prop] + "<br>";
//										}
//									}
//									
//									layer.bindPopup(popupText, { maxWidth: 500, maxHeight: 300 } );
									
									
									
									//event
									layer.on({
										mouseover: function(e){
											
										},
										click: function(e){
											//show local info
											showLocalInfo(e.target.feature.properties._DT_RowIndex, true);
										}
									});
								},
								
								//pointToLayer
								pointToLayer: function(feature, latlng){
									var icon=new L.icon({
											iconUrl: "images/marker-icon.png",
											iconSize: [12.5, 21],
											iconAnchor: [6.25, 10.5]
									});
									return new L.marker(latlng, {icon: icon})
								}
							},{
								//clusterclick event
								clusterclick: function(e){
									if(!e.layer._popup){
										var properties=pathgeo.util.readClusterFeatureProperies(e.layer, []);
										var html="<div class='popup'>There are <b>" + e.layer._childCount + "</b> twitters:<p></p><ul>";
										$.each(properties, function(i, property){
											html+="<li><img src='images/1359925009_twitter_02.png' width=20px />&nbsp; &nbsp; <b>"+ property[obj.fieldName.username]+"</b>: "+ property[obj.fieldName.text]+"</li>";
										});
										html+="</ul></div>";
										html=html.replace(/undefined/g, "Tweet");
											
										//highlight keyword
										html=pathgeo.util.highlightKeyword(obj.keywords,html);
													
										e.layer.bindPopup(html,{maxWidth:500, maxHeight:300}).openPopup();
									}else{
										e.layer.openPopup();
									}
								}
							}
					);
					app.controls.toc.addOverlay(obj.markerClusterLayer, "Cluster Map");
					
					
					
					//heatmap
					obj.heatMapLayer=pathgeo.layer.heatMap(obj.json);
					app.controls.toc.addOverlay(obj.heatMapLayer, "Heat Map");
					
					
					
					//showLayerNames
					//if this is the first time to load layers, the showLayerNames will be emplty.
					//so the default layer is geoJsonLayer
					if(showLayerNames.length==0){showLayerNames.push("geoJsonLayer");};
					$.each(showLayerNames, function(i, name){
						obj.layers.push(obj[name]);
					})
					
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
			obj.dataTable = pathgeo.util.geojsonPropertiesToArray(obj.json);
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
			"sPaginationType": "full_numbers", //page number
			"sDom": '<"dataTable_toolbar"<"dataTable_nav"><"dataTable_tools"f><"dataTable_menu"<"infobox_triangle"><"infobox">>><"dataTable_table"rti<pl>>', //DOM
			fnDrawCallback: function(){
			
				//backup orginal json to defaultJSON
				if (!obj.defaultJSON) {obj.defaultJSON = obj.json;}

				//if jumpPage==true, The datatable only jumps to the page. Don't need to re-read the geojson and redraw the table
				if (!app.jumpPage) {
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
							me.$('tr', {"filter": "applied"}).each(function(){
								$(this).attr("_dt_rowindex", this._DT_RowIndex);
								
								feature = features[this._DT_RowIndex];
								feature.properties._DT_RowIndex = this._DT_RowIndex;
								geojson.features.push(feature);
							});
							
							
							//overwrite app.geocodingResult.json and showlayer 
							if (geojson.features.length > 0){
							
								obj.json = geojson;
								showLayer(obj, true);
								
								//re-draw Chart
								showDataTableChart(obj.json);
							}
						}
					}, 500)
				}//end if app.jumpPage
				
			}//end drawCallback
		});// end init dataTable
		
		//set all columns in to app.dataTable. Should have another way to get columns
		app.dataTable.columns = dataTable.columns;
		
		
		//add dataTable tools and click event
		var html = "<ul>" +
					//"<li><img src='images/1365859519_cog.png' title='setting'/></li>"+
					"<li><img src='images/1365858910_download.png' title='download'/></li>" +
					"<li><img src='images/1365858892_print.png' title='print'/></li>" +
					"<li><img src='images/1365859564_3x3_grid_2.png' title='show / hide columns'/></li>" +
					//"<li><img src='images/1365860337_cube.png' title='canned report'/></li>"+
					//"<li><img src='images/1365860260_chart_bar.png' title='demographic data'/></li>"+
					//"<li><img src='images/1365978110_gallery2.png' title='map gallery'/></li>" +
					//"<li><img src='images/1365872733_sq_br_down.png' title='maximum map'/></li>"+
					"</ul>";
		$(".dataTable_tools").append(html).find("ul li").click(function(){
			//show content in the infobox
			showInfobox($(this).find("img").attr('title'), {
				left: $(this).offset().left,
				top: $(this).offset().top + 15
			}, this);
		});
		
	
		
		//dataTable nav bar
		$(".dataTable_nav").html($("#dataTable_nav").html())
		
		
		//copy dataTable toolbar html to dataTable_control
		$("#dataTable_control").html($(".dataTable_toolbar"));
		
		
		//click on rows
		$("#dataTable").delegate("tr:not([role='row'])", "click", function(){
			showLocalInfo($(this).context._DT_RowIndex);
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
		$("#dataTable_chart #select_y").append(html).change(onchange).val("sales").change();
		$(".dataTable_chartType").click(onchange);
		
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
				var isShow=($("#dataTable th:contains('"+ columnName + "')").length > 0) ? 'checked' : '';
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
function showLocalInfo(id, jumpToDataTablePage){
	var layer=app.geocodingResult.geoJsonLayer.layers[id],
		feature=layer.feature;
	
	
	//jump to the page in the dataTable
	if(jumpToDataTablePage){
		app.jumpPage=true;
		app.dataTable.fnPageChange(Math.floor(parseFloat(id)/10), true);
		app.jumpPage=false;
	}
	
	//highlight the tr in the dataTable
	var $tr=$("#dataTable tr");
	$.each(app.css["dataTable_highlightRow"], function(k,v){$tr.css(k,"");});
	$tr.closest("[_dt_rowindex=" + id +"]").css(app.css["dataTable_highlightRow"]);
	
	
	//zoom to the layer, shift lng a little bit to east
	var latlng=layer._latlng;
	app.map.setView(new L.LatLng(latlng.lat, latlng.lng-0.0025), 14)
			
			
	//reset layer to default style and change the selected layer icon
	app.geocodingResult.geoJsonLayer.eachLayer(function(layer){
		layer.setIcon(layer.defaultIcon);//.setOpacity(0.5);
	});

	layer.setIcon(new L.icon({
		iconUrl: "images/1365900599_Map-Marker-Marker-Outside-Pink.png",
		iconSize: [26, 26],
    	iconAnchor: [13, 13]
	})).setOpacity(1);
			
	
	//layer.openPopup();
	
			
	//trigger businessActions type to directly show the first option and draw its google chart
	$("#businessActions_type").attr("zipcode", feature.properties['zip']).change();
	
	
	
	//demographic Data
	//alert(app.layers.demographicData.toSource());
	var $obj=$("#demographic_type").html("");
	$.each(app.demographicData, function(k,v){
		// alert(k);  k is HC01_VC04, HC01_VC20, hc01_VC23 .....
		// alert(v);  v is "Total Population", "Total pouplation with childern at home". "Median household income",  .....
		$obj.append("<div data-role='collapsible'><h3 value='" + k + "'>"+v+"</h3><p><div id='localInfo_chart_" + k + "' style='overflow-y:auto; overflow-x:hidden'></div></p></div>");
	});
	
	$obj.collapsibleset("refresh").find("div[data-role='collapsible'] h3").click(function(){ //while clicking on the colllapse, redraw the demographic data and show on the map
		var value=$(this).attr("value");
		
		if(app.layers.demographicData){
			var demographic=app.layers.demographicData;
			//highlight the zipcode boundary
			demographic.redrawStyle(value, function(f){
				var defaultStyle=demographic.options.styles(f,value);
		
				if(f.properties["ZIP"]==feature.properties["zip"]){
					defaultStyle.width=4;
					defaultStyle.color="#666";
					defaultStyle.dashArray='';
				}
				
				return defaultStyle;
			}); 
			
			//change legend
			$(".leaflet-control-legend").html(demographic.getLegend(value));
		}
	});
	
	
	//highlight the zipcode boundary and show demographic data
	app.layers.demographicData.redrawStyle("HC01_VC04", function(f){
		var defaultStyle=app.layers.demographicData.options.styles(f,"HC01_VC04");
		
		if(f.properties["ZIP"]==feature.properties["zip"]){
			defaultStyle.width=4;
			defaultStyle.color="#666";
			defaultStyle.dashArray='';
		}
		
		return defaultStyle;
	});
	//app.layers.demographicData.addTo(app.map);//.bringToBack();
	//app.map.fitBounds(app.layers.demographicData.getBounds());


	//show legend
	var defaultType=$("#demographic_type div[data-role='collapsible'] h3").attr("value");
	//$(".leaflet-control-legend").html(app.layers.demographicData.getLegend(defaultType)).show();
			
	// alert(id);	 id is row number in table from 0
	//chart
	var totalPop=[
			['pop', 'Population'],
			['standard',  25678],
			['local',  28734]
	];
	//draw chart
	var containerId = "localInfo_chart_" + "HC01_VC20";
	showLocalInfoChart(totalPop, containerId);
	
	$.each(app.demographicData, function(k,v){
		var containerId = "localInfo_chart_" + k;
		var property = app.properties[feature.properties["zip"]];
		var chartData = [
			[k, v],
			['standard',  app.properties_average[k]],
			['local',  property[k]]
		];
		showLocalInfoChart(chartData, containerId);
	});

				
	
	//select options for social media
	//$select_media
	var location=app.geojsonReader.read(feature.geometry);
	var locationX = location.coordinate.x;
	var locationY = location.coordinate.y;
	//document.getElementById("lng").value = locationY;
	//document.getElementById("lat").value = locationX;
	$("#lng").val(locationY);
	$("#lat").val(locationX);
	var $select_media=$("#localInfo_socialMedia");
	//$select_media.html("<br/>Lat: <input type='text' id=lat value=" + locationX + "> <br/>Long: <input type='text' id=lng value=" + locationY + "> <br/>Keyword: <input type='text' id='keyword' value='shoes'><br><button type='button' onclick='callPython()'>Search</button>");
	

	
	
	//show localInfo
	$("#localInfo").show();
	
	
	//using jsts jts topology suite to find out the polygon the point is within
	var point=app.geojsonReader.read(feature.geometry);
	var polygon, withinLayer;

	if(app.layers.demographicData){
		$.each(app.layers.demographicData._layers, function(k,layer){
			polygon=app.geojsonReader.read(layer.feature.geometry);
			if(point.within(polygon)){
				withinLayer=layer;
				return false; //break the loop
			}
		});
		
		if(withinLayer){
			// $select.change(function(){
				// console.log(withinLayer.feature.properties[this.value]);
			// });
		}
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
					width: 300,
					height:500,
					title: "",
					titleX: "",
					titleY: "",
					legend: "none",//{position: 'top'},
					chartArea: {width: '', height: '85%', top:10},
					fontSize: 11,
					isStacked:true, 
					series:{0:{color: '#5B92C0', visibleInLegend: true}},
					vAxes:{0:{titleTextStyle:{color:"black"}, textStyle:{color:"#ffffff"}}},
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
				var zipcode=e.data.getValue(e.row, 0),
					value=e.value,
					html="";
				
				//header
				$("#businessActions_detailTitle").text(zipcode);
				
				//detailContent
				var properties=app.layers.demographicData.zipcodes[zipcode].feature.properties;
				$.each(properties, function(k,prop){
					if(k.split("extra-").length==1){ // only show origianl properties without extra properties
						html+="<li><a href='#'><img src='images/1368477544_FootballPlayer_Male_Dark.png'><p>" + k + "</p><h2>" + prop + "</h2></a></li>";
					}
				});
				$("#businessActions_detailContent ul").html(html).listview("refresh");
								
								
				//trigger dataTable to filter the zipcode
				//app.dataTable.fnFilter(zipcode);

				//show the detail of business actions
				$(".businessActions_tabs").hide();
				$("#businessActions_detail").show();

			}
		};
	
	
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
				v.addTo(app.map);
			});
			
			sort=[{column: 5, desc:true}] //according column 5 (orginalCustomers) to sort whole datasets.
			
			//chartOptions
			chartOptions.googleChartWrapperOptions.options.series[1]={color: '#ED3D86', visibleInLegend: false}; //set bar color=pink for highlight
			chartOptions.googleChartWrapperOptions.options.series[2]={color: 'transparent', visibleInLegend: false}; //set bar color=transparent for originalCustomers
			chartOptions.googleChartWrapperOptions.options.titleX="The number of customers";
			chartOptions.googleChartWrapperOptions.options.titleY="Zip Codes"
			
		break;
		case "top_sales":
			dataArray=[["zipcodes", "sum_sales"]];
			$.each(zipcodeLayer, function(k,v){dataArray.push([k, v.feature.properties["extra-sales_sum"]]);});
			chartOptions.googleChartWrapperOptions.options.titleX="The sum of sales";
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
				width: $("#dataTable_chart").width()-20,
				height: 225,
				title: "",
				titleX: x,
				titleY: y,
				legend: {position: 'right'},
				chartArea: {width: '85%', height: '84%', top:20},
				fontSize: 12,
				vAxes:{},
				hAxes:{},
				backgroundColor: {fill:'transparent'}
			}
		},
		callback:null,
		callback_mouseover:null,
		callback_mouseout:null,
		callback_select:function(obj){
			showLocalInfo(obj.value.properties._DT_RowIndex, true)
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



//search business Intelligent
function searchBusinessIntelligent(geoname){
	console.log(geoname);
}




//show demo
function showDemo(demoType){
	var obj=null;
	
	switch(demoType){
		case "SAN FRANCISCO":
			obj = {
				url: 'db/demo-SanFrancisco.json',
				title:'[DEMO] San Francisco shoes customer',
				keywords: []		
			}
		break;
		case "SAN DIEGO":
			obj = {
				url: 'db/demo-SanDiego.json',
				title:'[DEMO] San Diego demo data',
				keywords: []		
			}
		break;
	}
	
	if(obj){
		obj.type='GEOJSON';
		app.geocodingResult=obj;
		
		//show table
		showTable(app.geocodingResult);
	}
}



function showDialog(dom_id){
	$("#"+dom_id).popup("open");
}



