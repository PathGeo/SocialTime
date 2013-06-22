
#Standard Libraries
import cgi #import cgi library to get url parameters from users
import json as simplejson  #import libaray to use json


print "Content-Type: text/html \n"


app={
    "parameter":cgi.FieldStorage()
}



db={
    "pathgeodemo": "demo@42",
}



#get value from URL parameter--------------------------------------------
def getParameterValue(name):
    value="null"
    
    if(name in app["parameter"] and app["parameter"][name].value!=""):
	value=app["parameter"].getvalue(name)

    return value
#--------------------------------------------------------------------------



#main
email=getParameterValue("email")
password=getParameterValue("password")



obj={
        "status":"error",
        "msg":"email or password is not correct! <br>Please check again"
}

#check email and password
if (email in db) and (password == db[email]):
    obj={
        "status":"ok",
        "msg":"null"
    }


#print result
print simplejson.dumps(obj)


