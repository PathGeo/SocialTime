import twython
from GeocodingEngine.Geocoder import CityGeocoder
import cgi, cgitb
import geopy, re
from geopy import distance
import json
import time

CONSUMER_KEY = 'Gj7wCc4PwgyRqohJtmMnFg'
CONSUMER_SECRET = '3lhN2v6Depn4CDuUk8lRoRYNzubOiMmw4WVd82mQbc'
ACCESS_TOKEN = '801532308-060F9MMLRCnfjCeaZNzjMrS9tlz7KCGsB698ifcL'
ACCESS_TOKEN_SECRET = '3QKHeH34YyV7rAUXoJhyki5ilp2ySKRhHTePvPkIw'

#enable debugger
cgitb.enable()

data = cgi.FieldStorage()
keyword = data['kwd'].value
lat = data['lat'].value
lng = data['lng'].value
rad = data['rad'].value
ts = data['ts'].value

results = []

api = twython.Twython(CONSUMER_KEY, CONSUMER_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)

geocoder = CityGeocoder()
	
tweets = []
newTweets = api.search(q=keyword, geocode=lat + "," + lng + "," + rad + "mi", count=100)['statuses']

while len(newTweets) > 0 and len(tweets) < 300:
	time.sleep(1)
	tweets += newTweets
	newTweets = api.search(q=keyword, geocode=lat + "," + lng + "," + rad + "mi", count=100, max_id=tweets[-1]['id']-1)['statuses']


	
for tweet in tweets:
	try:
		text = str(tweet['text'].encode('ascii', 'ignore'))
		date = str(tweet['created_at'])
		user_name = str(tweet['user']['screen_name'].encode('ascii', 'ignore'))
		profile_img = str(tweet['user']['profile_image_url'])
		
		props = dict(Img=profile_img, Title=text, Date=date, Account=user_name, Source="twitter")

		#If the tweet is geotagged, use that lat/lon for location
		if tweet['geo'] and tweet['geo']['coordinates']:
			coords = tweet['geo']['coordinates'][::-1]		
			results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=coords), properties=props))

		#Or else, if the tweet has a location, try to geocode it
		elif 'user' in tweet and 'location' in tweet['user']['location']:
			city, (glat, glon) = geocoder.lookup(str(tweet['user']['location'].encode('ascii', 'ignore')))
			
			#make sure that geocoded lat and lons are within search radius
			if glat and glon and distance.distance((lat, lng), (glat, glon)).miles <= float(rad):
				results.append(dict(type="Feature", geometry=dict(type="Point", coordinates=[glon, glat]), properties=props))
	except Exception, e:
		pass

print ''	
print json.dumps(results)
