var curLayer;
var curData = [];
//Work in Progrss... social media viewing
function callPython(){
	
	var keywordTemp = document.getElementById("socialMedia_keyword").value;
	var keywordArray = keywordTemp.split(" ");
	keyword = keywordArray[0];
	for(i=1; i<keywordArray.length; i++){
		keyword =  keyword + "+" + keywordArray[i];
	}
	
	var lat = document.getElementById("lat").value;
	var lng = document.getElementById("lng").value;
	//var rad = document.getElementById("socialMedia_spatial").value;
	var rad = 15;
	//var ts = (Math.floor(Date.now()/1000)) - (document.getElementById("socialMedia_temporal").value);
	var ts = (Math.floor(Date.now()/1000)) - (63072000);
	var source = document.getElementById("socialMedia_source").value;
	
	
	if(source == "flickr"){
		//Search Flickr
		$.ajax({
			type: "POST",
			url: "photo_search.py",
			data: {kwd:keyword, lat:lng, lng:lat, rad:rad, ts:ts},
			beforeSend: function(xhr){
				if (xhr.overrideMimeType){
					xhr.overrideMimeType("application/json");
				}
			}
		}).success(function( contact ) {
		console.log(contact);
			if (curLayer && app.map.hasLayer(curLayer)) app.map.removeLayer(curLayer);
			if (contact == 0){
				$("#search_results").html('');
				$('#social_results_count').html('');
				$("#layer_selector").hide();
				alert("No results were found");
			}
			
			else{
				var count = contact.length;
				$("#search_results").html('');
				$('#social_results_count').html("There are <b>" + count + "</b> results<br/>");
				$('#social_results_search').html("Seacrh: <input type='text' name='search' id='search' value=''><input type='submit' value='Search' onClick='filterResults()'>");
			
				for(i=0; i<count; i++){
				
					var title = contact[i].properties.Title;
					var description = contact[i].properties.Description;
					var image = contact[i].properties.Img;
					var date = contact[i].properties.Date;
					var account = contact[i].properties.Account;
				
					var results = "<li><h2>" + title + "</h2><img src='" + image + "' alt='...' style='float:left; margin-right:5px'>" + account + "<br/><p>" + date + "</p><br/></li>";
					$("#search_results").append(results);
				}
				
				$('#search_results').trigger('create');
				$('#search_results').listview('refresh');
				$("#layer_selector").show();
				$("#point_media").addClass( "ui-btn-active" );
				$("#heat_media").removeClass( "ui-btn-active" );
				$("#cluster_media").removeClass( "ui-btn-active" );
				
				setDataMedia(contact);
				app.map.fitBounds(curLayer.getBounds());
			}

		}).error(function(error) {
			console.log(error);
			alert("There was an error in your search. Please try again");
		});
	}
	
	
	if(source == "twitter"){
		//Search Twitter
		$.ajax({
			type: "POST",
			url: "twitter_search.py",
			data: {kwd:keyword, lat:lng, lng:lat, rad:rad, ts:ts},
			beforeSend: function(xhr){
				if (xhr.overrideMimeType){
					xhr.overrideMimeType("application/json");
				}
			}
		}).success(function( contact ) {
		//console.log(contact);
			if (curLayer && app.map.hasLayer(curLayer)) app.map.removeLayer(curLayer);
			if (!contact){
				$("#search_results").html('');
				$('#social_results_count').html('');
				$("#layer_selector").hide();
				alert("No results were found");
			}
			
			else{
				var count = contact.length;
				$("#search_results").html('');
				$('#social_results_count').html("There are <b>" + count + "</b> results<br/>");
				$('#social_results_search').html("Seacrh: <input type='text' name='search' id='search' value=''><input type='submit' value='Search' onClick='filterResults()'>");

				for(i=0; i<count; i++){
				
					var title = contact[i].properties.Title;
					//var description = contact[i].properties.Description;
					var image = contact[i].properties.Img;
					var date = contact[i].properties.Date;
					//var lat = contact[i].geometry.coordinates[0];
					var account = contact[i].properties.Account;
				
					var results = "<li><h2>" + title + "</h2><img  src=" + image + " alt='...' style='float:left; margin-right:5px'><a href='http://twitter.com/" + account + "' target='_blank'>@" + account + "</a><br/><p>" + date + "</p><br/></li>";
					$("#search_results").append(results);
				}
				
				$('#search_results').trigger('create');
				$('#search_results').listview('refresh');
				$("#layer_selector").show();
				$("#point_media").addClass( "ui-btn-active" );
				$("#heat_media").removeClass( "ui-btn-active" );
				$("#cluster_media").removeClass( "ui-btn-active" );
				
				setDataMedia(contact);
				app.map.fitBounds(curLayer.getBounds());
			}

		}).error(function(error) {
			console.log(error);
			alert("There was an error in your search. Please try again");
		});
		}
	
	
	
}

function getClusterLayerMedia(gjData) {
	var clusterLayer = new L.MarkerClusterGroup({ 
		spiderfyOnMaxZoom: false, 
		showCoverageOnHover: true, 
		zoomToBoundsOnClick: false,
		iconCreateFunction: function(cluster) {
			//return new L.DivIcon({ html: cluster.getChildCount(), className: 'mycluster', iconSize: new L.Point() });
			if(curData[0].properties.Source == "twitter"){
				var image = "newTweet";
			}
			else{
				var image = "newPhoto";
			}
			
			var amount = cluster.getChildCount();
			if (amount >=10){
				var icon = "<img border='0' src='images/" + image + ".png' width='62' height='74'>";
			}
			else if (amount >=5){
				var icon = "<img border='0' src='images/" + image + ".png'  width='50' height='61'>";
			}
			else{
				var icon = "<img border='0' src='images/" + image + ".png'>";
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
				html += "<li><span class='ui-icon ui-icon-circle-plus iconExpand' style='display:inline-block'></span><span class='clusterInfo'>" + property.Title + "</span><br><div class='extras' style='margin-bottom: 10px;'>" + property.Img + "<br><br>" + property.Description + "</div></li>";
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
			if(props.Source == "flickr"){
				var html = "<div class='popup'><ul><li><span class='clusterInfo'>" + props.Account + "</span><br><br><div class='extras' style='display: block;'> " + props.Img + "<br/><br/>" + props.Date + "</li></ul></div>";
			}
			else{
				var html = "<div class='popup'><ul><li><span class='clusterInfo'>" + props.Title + "</span><br/><div class='extras' style='display: block;'><a href='http://twitter.com/" + props.Aaccount + "' target='_blank'>" + props.Account + "</a><br/><br/>" + props.Date + "</li></ul></div>";
			}
			layer.bindPopup(html);
		}, 	pointToLayer: function (feature, latlng) {
		
			var props = feature.properties;
			var url;
			if(props.Source == "flickr"){
				url = "images/newPhoto.png";
			}
			else{
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
	heatmapLayerMedia.addData(heatmapDataMedia);
	return heatmapLayerMedia;
}

function switchLayersMedia(newLayerName) { 
	
	if (curLayer && app.map.hasLayer(curLayer)) app.map.removeLayer(curLayer);
	
	if (newLayerName == "heatmap") {
		curLayer = getHeatmapLayerMedia(curData);
		app.map.addLayer(curLayer);
	} else if (newLayerName == "point") { 
		curLayer = getPointLayerMedia(curData);
		app.map.addLayer(curLayer);
	} else if (newLayerName == "cluster") { 
		curLayer = getClusterLayerMedia(curData);
		app.map.addLayer(curLayer);
	}
	else if (newLayerName == "census") {
		enableCensusLayer();
		//$(".legend").show();
		curLayer = getPointLayerMedia(curData);
		app.map.addLayer(curLayer);
	}
}

function setDataMedia(data) {
	curData = data;
	//console.log(curData);
	//$(".features").removeClass("selected").addClass("selectable");
	switchLayersMedia("point");
	//$("#point").toggleClass("selected selectable");
}

function filterResults(){
	var keyword = String(document.getElementById("search").value);
	//console.log(keyword);
	
	
	var count = curData.length;
	var newCount = 0;
	$("#search_results").html('');
	//$('#social_results_count').html("There are <b>" + count + "</b> results<br/>Seacrh: <input type='text' name='search' id='search' value='' onkeyup='filterResults()'>");

	for(i=0; i<count; i++){
	
		
	
		var title = String(curData[i].properties.Title);
		var n1=title.search(keyword);
		
		var description = curData[i].properties.Description;
		var n2=description.search(keyword);
		
		var account = String(curData[i].properties.Account);
		var n3=account.search(keyword);
		
		var image = curData[i].properties.Img;
		var date = curData[i].properties.Date;

		
		if(n1>=0 || n2>=0 || n3>=0){
			var results = "<li><h2>" + title + "</h2><img src='" + image + "' alt='...' style='float:left; margin-right:5px'>" + account + "<br/><p>" + date + "</p><br/></li>";
			$("#search_results").append(results);
			newCount++;
		}
		
		$("#search_results_count").html('');
		$('#social_results_count').html("There are <b>" + newCount + "</b> results<br/>");
		$('#search_results').trigger('create');
		$('#search_results').listview('refresh');
	}

}