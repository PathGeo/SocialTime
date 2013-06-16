import requests
import json
import cgi
import geopy, re
import time

print ""
geocoder = geopy.geocoders.GeoNames()

data = cgi.FieldStorage()
keyword = data['kwd'].value
lat = data['lat'].value
lng = data['lng'].value
rad = data['rad'].value
ts = data['ts'].value

#geoResults = geocoder.geocode(location, exactly_one=False)

#if not geoResults:
	#print json.dumps("Nice try, but the location could not be found.")
	#exit()
	
#place, (lat, lng) = geoResults[0]

results = []
count = 0

for x in range(1,3):
	time.sleep(1)
	r = requests.get("http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=7262b19617c5a5f568a9b3f25c946c5b&tags=" + keyword + "&lat=" + str(lat) + "&lon=" + str(lng) + "&radius=" + str(rad) + "mi&min_upload_date=" + str(ts) + "&per_page=250&page=" + str(x) + "&extras=description,date_upload,date_taken,owner_name,geo,views&has_geo=1&format=json&nojsoncallback=1")
	output=r.json()

	#results = []
	#count = 0

	for i in output['photos']['photo']:
		count += 1
		name = i.get('ownername', 'no owner name')
		image = "http://farm" + str(i['farm']) + ".staticflickr.com/" + str(i['server']) + "/" + str(i['id']) + "_" + str(i['secret']) + "_s.jpg"
		account = "<a href='http://www.flickr.com/photos/" + str(i['owner']) + "/" + str(i['id']) + "' target='_blank'>" + name + "</a>"
		doc = {}
		doc['type'] = "Feature"
		doc['geometry'] = { "type": "Point"}
		doc['properties'] = {}
		doc['geometry']['coordinates'] = [i['longitude'], i['latitude']]
		doc['properties']["Title"] = i['title']
		doc['properties']["Img"] = image
		doc['properties']["Description"] = i['description']['_content']
		doc['properties']["Date"] = i['datetaken']
		doc['properties']["Source"] = "flickr"
		doc['properties']["Account"] = account
		
		results.append(doc)
	
if count == 0:
	print json.dumps(count)
else:
	print json.dumps(results)
