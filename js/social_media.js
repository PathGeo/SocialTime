var curLayer;
var curData = [];


//Work in Progrss... social media viewing
function callPython(inputValue){
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
			search();
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
		var obj = {
			twitter: {
				url: "python/twitter_search.py",
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
						html += "<li><a hrsef='#'><img src='" + image + "'/><h2>" + account + "</h2><p class='socialMedia_description'>" + title + "</p><p class='ui-li-aside'><strong>" + date.split(" ")[0] + "</strong></p></a><a href='http://twitter.com/" + account + "' target='_blank'>Go to this Tweet</a></li>";
					});
					return html;
				}
			},
			flickr: {
				url: "python/photo_search.py",
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
						
						html += "<li><a href='#'><img src='" + image + "'/><h2>" + $(account).html() + "</h2><p class='socialMedia_description'>" + title + "</p><p class='ui-li-aside'><strong>" + date.split(" ")[0] + "</strong></p></a>" + account + "</li>";
					});
					return html;
				}
			}
		}
		
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
					//console.log(contact);
					if (curLayer && app.map.hasLayer(curLayer)){
						app.map.removeLayer(curLayer);
					}
						
					if (contact.length == 0 || !contact) {
						$('#search_results').html('');
						$("#layer_selector, #socialMedia_loading").hide();
						alert("No results were found. Please use another keywords or remove location (ex: @) to try again.");
					}else {
						//append source header in the listview
						$("#search_results").html('')
											.append("<li data-role='list-divider'>" + source + "<span class='ui-li-count'>" + contact.length + "</span></li>")
											.append(o.readData(contact))
											.trigger('create').listview('refresh')
											.prev().on("keyup",function(){   //if do filter by inputting some keytwords, the count will automatically change
										    	var count=$("#search_results li:visible").length-1;
												$("#search_results .ui-li-count").html(count);
										    });
						
						$("#point_media").addClass("ui-btn-active");
						$("#heat_media").removeClass("ui-btn-active");
						$("#cluster_media").removeClass("ui-btn-active");
						
						$("#socialMedia_result, #socialMedia_mapType").show();
						$("#socialMedia_loading, #socialMedia_gallery").hide();
						
						setDataMedia(contact);
						app.map.fitBounds(curLayer.getBounds());
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