//Load Google Charts and set callback
google.load("visualization", "1", {packages:["corechart", "table"]});

var app={
	map:null,
	basemaps:{
			"Cloudmade": L.tileLayer("http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/{styleId}/256/{z}/{x}/{y}.png", {styleId: 22677}),
			"OpenStreetMap": L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
			"Google Streetmap":L.tileLayer("https://mts{s}.googleapis.com/vt?lyrs=m@207265067&src=apiv3&hl=zh-TW&x={x}&y={y}&z={z}&s=Ga&style=api%7Csmartmaps",{subdomains:"123", attribution:"Map Source from Google"}),
			"Nokia Satellite":L.tileLayer("http://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/b9e8949142/hybrid.day/{z}/{x}/{y}/256/png8?app_id=SqE1xcSngCd3m4a1zEGb&token=r0sR1DzqDkS6sDnh902FWQ&lg=ENG",{subdomains:"1234", attribution:"Map Source from Nokia"})
	},
	layers:[
			{name:"[WMS]States", type: "WMS", url:"http://sgis.kisr.edu.kw/geoserver/topp/wms", srs:"EPSG:4326", param:{layers:"topp:states", attribution:""}}
	],
	searchResult:{
			name: "searchResult", 
			type: "GEOJSON", 
			url: "db/demo-data300.json",
			srs: "EPSG:4326",
			title: "Demo Data",
			fieldName:{username:null, text:null},
			keywords:[],
			DomID_dataList: "datalist_container",
			getColor:function(d) {
				return d > 94913  ? '#800026' :
					   d > 81354   ? '#BD0026' :
					   d > 67795   ? '#E31A1C' :
					   d > 54236   ? '#FC4E2A' :
					   d > 40677    ? '#FD8D3C' :
					   d > 27118    ? '#FEB24C' :
					   d >  13559    ? '#FED976' : '#FFEDA0';
			},
			getLegend:function(){
				var grades = [0, 13559    , 27118    , 40677    , 54236   , 67795   , 81354   , 94913 ],
					label='<b>Household Income</b><p></p><ul>',
					me=this;
				$.each(grades, function(i,grade){
					to = grades[i + 1];
					label+='<li style="background:' + me.getColor(grade + 1) + '">$' + grade + (to ? '&ndash;$' + to : '+') + "</li>";
				});
				return label;
			},
			getStyle:function(feature){
				return {
					weight: 2,
					opacity: 1,
					color: 'white',
					dashArray: '3',
					fillOpacity: 0.6,
					fillColor: feature.getColor(feature.properties.income)
				}
			}
	},
	controls:{
		toc:{},
		mapGallery: L.Control.extend({
		    options: {collapsed: true,position: 'topright',text: 'Map Gallery',},
			initialize: function (options) {L.Util.setOptions(this, options);},
		    onAdd: function (map) {
		        // create the control container with a particular class name
		        var container = L.DomUtil.create('div', 'leaflet-control-mapGallery');
				$(container).html($("#div_gallery").html())
				
				//mouseevent
				if(this.options){
					L.DomEvent.addListener(container, 'mouseover', function(){$("#mapGallery").show();}, this);
					L.DomEvent.addListener(container, 'mouseout', function(){$("#mapGallery").hide();}, this);
				}
		        return container
		    }
		}),
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
	showLayers:[] //layers are shown in the map
}




//init
$(document).on("pageinit", function(){	  
	init_UI();
	
	$("#pageMap").live("pageshow",function(event, ui) {
        init_map();
    });
		
	
	$("#submit_button").click(function (e) {
		$("#img_loading").show();
	});
	
	$('#upload_excel').ajaxForm({
		dataType:  'json',
		timeout: 20000,  
		success: function(data) { 
			
			if (data.length <= 0) return;
			
			 app.searchResult={
				 name: "searchResult", 
				 type: "GEOJSON",
				 json: data,
				 srs: "EPSG:4326",
				 title: "keyword",
				 fieldName:{username:null, text:"text"},
				 keywords: "testing"
			 };

			showLayer(app.searchResult, true);
			
			app.map.fitBounds(app.searchResult.geoJsonLayer.getBounds());
		}
	});
});




//init openlayers
function init_map(){
	var map_height=((($(document).height()-$("#header").height()) / $(document).height())*100-2.2)+"%";
	$("#div_map").css({height:map_height});
	
	app.map = L.map("div_map", {
        center: app.initCenterLatLng,
		zoom: app.initCenterZoom,
		layers:[app.basemaps["Cloudmade"]],
		attributionControl:false,
		trackResize:true
    }); 
	
	//move the location of zoomcontrol to the top right
	app.map.zoomControl.setPosition("topright")
	
	//layers control
	app.controls.toc=L.control.layers(app.basemaps);

	//map gallery control
	app.map.addControl(new app.controls.mapGallery()).addControl(new app.controls.legend());;
	
	//show all layers
	$.each(app.layers, function(i, layer){ showLayer(layer,false); } );
	
	
	//tets
	pathgeo.service.demographicData({
		callback:function(geojsonLayer){
			//geojsonLayer.redrawStyle("HC01_VC85")
			geojsonLayer.addTo(app.map)
		}
	});
}



//init UI
function init_UI(){
	$("#div_gallery ul li").click(function(){
		$(this).css("background-color", "#222222").siblings().css("background-color","");
	});
	
	//init popup
	$("div[data-role='popup']").popup();
	
}



//load geojson
function showLayer(obj, isShow){
		//show title
		if(obj.title){$("#lbl_dataName").html(obj.title);}
		
		//dataList
		if(obj.DomID_dataList){$("#"+obj.DomID_dataList+" ul").html("")}
		
		//feature count
		obj.featureCount=0;
		
		//show layer
		switch(obj.type){
			case "GEOJSON":
				if(!obj.json){
					$.getJSON(obj.url, function(json){
						obj.json=json;
						showGeojson(obj);
					});
				}else{
					showGeojson(obj);
				}
				
				
				//show geojson
				function showGeojson(object){
					parseGeojson(object);
					addLayer(object);
					
					//show legend
					if(obj.getLegend && obj.getLegend()!=""){
						$(".leaflet-control-legend").html(obj.getLegend()).show();
					}
					

					//show datalist
					$("#dialog_dataPanel").panel("open");
					$("#dialog_dataPanel").trigger("updatelayout");
					//hide loadData dialog
					$("#dialog_uploadData").popup("close");
				}
				
				
				//parse geojson
				function parseGeojson(obj){
					//create layer
					if(!obj.geoJsonLayer){
						obj.geoJsonLayer=L.geoJson(obj.json, {
								onEachFeature:function(feature,layer){
									var html="<div class='popup'><ul><li><img src='images/1359925009_twitter_02.png' width=20px />&nbsp; &nbsp; <b>"+ feature.properties[obj.fieldName.username]+"</b>: "+ feature.properties[obj.fieldName.text]+"</li></ul></div>";
									html=html.replace(/undefined/g, "Tweet");
									
									//highlight keyword
									html=pathgeo.util.highlightKeyword(obj.keywords,html);
									//info window
									layer.bindPopup(html,{maxWidth:500, maxHeight:300});
									
									//dataList
									if(obj.DomID_dataList){
										$("#"+obj.DomID_dataList+" ul").append("<li id='" + obj.featureCount + "' onclick=\"showDataDetail(this.id);\"><a href='#'>"+ feature.properties["ZIP"]+"<span class='ui-li-count'>" + obj.featureCount + "</span></a></li>");
										obj.featureCount++;
									}
									
									//event
									layer.on({
										mouseover: function(e){
											e.target.setStyle({
												weight: 3,
												color: '#666',
												dashArray: '',
												fillOpacity: 0.7
											});
											if (!L.Browser.ie) {e.target.bringToFront();}
										},
										mouseout: function(e){
											obj.geoJsonLayer.resetStyle(e.target);
										}
									})
								},
								
								//style
								style: (function(){
									if(obj.getStyle){
										return function(feature){
											feature.getColor=obj.getColor;
											return obj.getStyle(feature);
										}
									}else{
										return {}
									}
								})()
						});
						app.controls.toc.addOverlay(obj.geoJsonLayer, "GeoJSON");
						obj.layer=obj.geoJsonLayer;
						
						//refresh listview
						if (obj.DomID_dataList) {$("#"+obj.DomID_dataList+" ul").listview("refresh");}
					}
					
					//marker cluster
					if(!obj.markerClusterLayer){
						obj.markerClusterLayer = pathgeo.layer.markerCluster(obj.json, {
								onEachFeature: function (feature, layer) {
									var props = feature.properties;
									var popupText = '';
									
									for (var prop in props) { 
										var fieldName = prop.charAt(0).toUpperCase() + prop.slice(1);
										
										if (fieldName.toLowerCase() != "loc") {
											popupText += "<b>" + fieldName + "</b>: " + feature.properties[prop] + "<br>";
										}
									}
									
									layer.bindPopup(popupText, { maxWidth: 500, maxHeight: 300 } );
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
						app.controls.toc.addOverlay(obj.markerClusterLayer, "MarkerCluster");
					}
					
					//heat map				
					if(!obj.heatMapLayer){
						obj.heatMapLayer=pathgeo.layer.heatMap(obj.json);
						app.controls.toc.addOverlay(obj.heatMapLayer, "Heatmap");
					}
				}//end parseGeojson
				
			break;
			case "WMS":
				//default param
				if(obj.param && obj.param.layers){
					obj.param.format= obj.param.format || 'image/png';
					obj.param.transparent=obj.param.transparent || true
					
					obj.layer = L.tileLayer.wms(obj.url, obj.param);
					
					//events
					obj.layer.on("load", function(e){
						console.log("loaded");
					});
					
					//obj.layer.setOpacity(0.75).addTo(app.map).bringToFront();
					addLayer(obj);
					app.controls.toc.addOverlay(obj.layer, obj.name);
				}
			break;
		}
		
		
		
		function addLayer(obj){
			if(isShow){
				obj.layer.addTo(app.map);
				app.showLayers.push(obj.layer);
				
				app.map.fitBounds(app.searchResult.geoJsonLayer.getBounds());
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
				layer=app.searchResult.markerClusterLayer.addTo(app.map);
			break;
			case "HEATMAP":
				layer=app.searchResult.heatMapLayer.addTo(app.map);
			break;
			case "GEOJSON":
				layer=app.searchResult.geoJsonLayer.addTo(app.map);
			break;
		}
		app.showLayers.push(layer);
	});
}




function getTweets(data){
	//show loading imag
	$("#img_loading").show();
	
	//clear previous result
	if(app.searchResult && app.searchResult.layer){
		removeLayers();
		app.controls.toc.removeLayer(app.searchResult.layer);
		app.controls.toc.removeLayer(app.searchResult.markerClusterLayer);
		app.controls.toc.removeLayer(app.searchResult.heatMapLayer);
	}
		
	var key=$("#keyword").val(),
		radius=$("#radius").val(),
		keyword=$("#car").val();
	
	
	if(data=='demo'){
		$.getJSON("db/ford.json", function(geojson){
			app.searchResult={
				name: "searchResult", 
				type: "GEOJSON", 
				json: geojson,
				srs: "EPSG:4326",
				title: "Demo Data",
				fieldName:{username:"user name", text:"text_"},
				keywords:["FORD", "FUSION", "ESCAPE"]
			};
			showLayer(app.searchResult, true);
		});
	}else{
		pathgeo.service.search(key, radius, keyword, function(geojson){
			app.searchResult={
				name: "searchResult", 
				type: "GEOJSON", 
				json: geojson,
				srs: "EPSG:4326",
				title: keyword + "around " + radius + " miles in " + key,
				fieldName:{username:null, text:"text"},
				keywords:[keyword]
			};
			showLayer(app.searchResult, true);
		});
	}
	
	//change background-color in the default map
	$("#div_gallery ul li:first").css("background-color", "#222222").siblings().css("background-color","");
}


//remove all layers on the map
function removeLayers(){
	if(app.showLayers.length>0){
		$.each(app.showLayers, function(i,layer){
			app.map.removeLayer(layer);
		});
		app.showLayers=[];
	}
}


//show data detail
function showDataDetail(layer_id){
	
	if(!app.searchResult.geoJsonLayer.layers){
		//convert object to array
		app.searchResult.geoJsonLayer.layers=$.map(app.searchResult.geoJsonLayer._layers, function(v,k){return v});
	}
	
	if(app.searchResult.geoJsonLayer.layers[layer_id]){
		var layer=app.searchResult.geoJsonLayer.layers[layer_id],
			properties=layer.feature.properties,
			title=properties["ZIP"];
			html=pathgeo.util.objectToHtml(properties);
		
		//highlight feature
		layer.fire("mouseover")
		
		
		
		//show
		$("#dataDetail").css({height: $("#div_map").height()-10})
		$("#dataDetail_title").html(title);
		$("#dataDetail_content").html(html);

		//draw google chart
		html="<li><b>Demographic: Sex</b><br><div id='chart_demographic_sex'></div></li>"+
			 "<li><b>SocialMedia:</b><br><div id='chart_socialmedia'></div></li>";
		$("#dataDetail_content ul").append(html);
		
		//chart data
		var sexData=[
			['Sex', 'Population'],
			['Male',  25678],
			['Female',  28734]
		];
		
		var socialmediaData=[
			['Date', 'Reputation'],
			['Feb 16',  -8],
			['Feb 17',  0], 
			['Feb 18',  16],
			['Feb 19',  20],
			['Feb 20',  26],
			['Feb 21',  22],
			['Feb 22',  20],
			['Feb 23',  30],
			['Feb 24',  45],
			['Feb 25',  63],
			['Feb 26',  70],
			['Feb 27',  65],
			['Feb 28',  77],
			['Mar 1',  82]        
		];
		
		drawChart("PieChart",sexData, "chart_demographic_sex", {
			title:'Sex',
			backgroundColor:{fill:"transparent"}
		});
		
		drawChart("LineChart",socialmediaData, "chart_socialmedia", {
			title:'SocialMedia',
			backgroundColor:{fill:"transparent"}
		});
		
		
		
		
		//show datadetail and hide datalist
		$("#dataDetail").show();
		$("#dataList").hide();
		
	}
	
	
}


//drawChart
function drawChart(chartType, data, domID, options){
	if(!chartType || !data ||!domID){console.log("[ERROR] drawChart: no chartType, data, or domID"); return;}
	
	if(!options){options={}}
	options.title=options.title || "";
    options.width=options.width || "";
    options.height=options.height || "";
    options.backgroundColor=options.backgroundColor || {};
    options.is3D=options.is3D || true;
	
	
	data = google.visualization.arrayToDataTable(data);
	
	var gChart, containerID=document.getElementById(domID);
	switch (chartType) {
		case "ColumnChart":gChart = new google.visualization.ColumnChart(containerID);break;
		case "AreaChart":gChart = new google.visualization.AreaChart(containerID);break;
		case "LineChart":gChart = new google.visualization.LineChart(containerID);break;
		case "PieChart":gChart = new google.visualization.PieChart(containerID);break;
		case "BarChart":gChart = new google.visualization.BarChart(containerID);break;
		case "BubbleChart":gChart = new google.visualization.BubbleChart(containerID);break;
		case "CandlestickChart":gChart = new google.visualization.CandlestickChart(containerID);break;
		case "ComboChart":gChart = new google.visualization.ComboChart(containerID);break;
		case "MotionChart":gChart = new google.visualization.MotionChart(containerID);break; //must include  google.load('visualization', '1', {packages: ['motionchart']});
		case "Table":gChart = new google.visualization.Table(containerID);break; //must include google.load('visualization', '1', {packages: ['table']});
	}
	gChart.draw(data, options);
}




function showDialog(dom_id){
	$("#"+dom_id).popup("open");
}



