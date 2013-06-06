import tweepy
from GeocodingEngine.Geocoder import CityGeocoder
import cgi, cgitb
import geopy, re
from geopy import distance
import json
import time

#enable debugger
cgitb.enable()

data = cgi.FieldStorage()
keyword = data['kwd'].value
lat = data['lat'].value
lng = data['lng'].value
rad = data['rad'].value
ts = data['ts'].value

results = []

api = tweepy.API()
geocoder = CityGeocoder()

#for x in range(1,3):
	
tweets1 = api.search(q=keyword, geocode=lat + "," + lng + "," + rad + "mi", rpp=100, page=1, show_user=True)
time.sleep(1)
tweets2 = api.search(q=keyword, geocode=lat + "," + lng + "," + rad + "mi", rpp=100, page=2, show_user=True)
time.sleep(1)
tweets3 = api.search(q=keyword, geocode=lat + "," + lng + "," + rad + "mi", rpp=100, page=3, show_user=True)
time.sleep(1)
tweets4 = api.search(q=keyword, geocode=lat + "," + lng + "," + rad + "mi", rpp=100, page=4, show_user=True)
	
	
#geocoder = CityGeocoder()
#results = []

#Loop through 1st round of Tweets
for tweet in tweets1:
	#If the tweet is geotagged, use that lat/lon
	if tweet.geo and tweet.geo['coordinates'] and tweet.geo['coordinates'][0] and tweet.geo['coordinates'][1]:
		lat, lon = tweet.geo['coordinates']
		results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[lon, lat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))

	#Or else, if the tweet has a location, try to geocode it
	elif hasattr(tweet, "location"):
		city, (glat, glon) = geocoder.lookup(tweet.location.encode("ascii", "ignore"))
		
		#make sure that geocoded lat and lons are within search radius
		if glat and glon and distance.distance((lat, lng), (glat, glon)).miles <= float(rad):
			results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[glon, glat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))


#Loop through 2nd round of Tweets
for tweet in tweets2:
	#If the tweet is geotagged, use that lat/lon
	if tweet.geo and tweet.geo['coordinates'] and tweet.geo['coordinates'][0] and tweet.geo['coordinates'][1]:
		lat, lon = tweet.geo['coordinates']
		results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[lon, lat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))

	#Or else, if the tweet has a location, try to geocode it
	elif hasattr(tweet, "location"):
		city, (glat, glon) = geocoder.lookup(tweet.location.encode("ascii", "ignore"))
		
		#make sure that geocoded lat and lons are within search radius
		if glat and glon and distance.distance((lat, lng), (glat, glon)).miles <= float(rad):
			results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[glon, glat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))
			
#Loop through 3rd round of Tweets
for tweet in tweets3:
	#If the tweet is geotagged, use that lat/lon
	if tweet.geo and tweet.geo['coordinates'] and tweet.geo['coordinates'][0] and tweet.geo['coordinates'][1]:
		lat, lon = tweet.geo['coordinates']
		results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[lon, lat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))

	#Or else, if the tweet has a location, try to geocode it
	elif hasattr(tweet, "location"):
		city, (glat, glon) = geocoder.lookup(tweet.location.encode("ascii", "ignore"))
		
		#make sure that geocoded lat and lons are within search radius
		if glat and glon and distance.distance((lat, lng), (glat, glon)).miles <= float(rad):
			results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[glon, glat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))
			
#Loop through 4th round of Tweets
for tweet in tweets4:
	#If the tweet is geotagged, use that lat/lon
	if tweet.geo and tweet.geo['coordinates'] and tweet.geo['coordinates'][0] and tweet.geo['coordinates'][1]:
		lat, lon = tweet.geo['coordinates']
		results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[lon, lat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))

	#Or else, if the tweet has a location, try to geocode it
	elif hasattr(tweet, "location"):
		city, (glat, glon) = geocoder.lookup(tweet.location.encode("ascii", "ignore"))
		
		#make sure that geocoded lat and lons are within search radius
		if glat and glon and distance.distance((lat, lng), (glat, glon)).miles <= float(rad):
			results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[glon, glat]), properties=dict(Img=str(tweet.profile_image_url), Title=tweet.text, Date=str(tweet.created_at), Account=str(tweet.from_user), Source="twitter")))


			
print ''	
print json.dumps(results)