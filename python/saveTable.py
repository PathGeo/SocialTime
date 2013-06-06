
#PathGeo Libraries
from DataFactory.DataTable import DataTableFactory

#Standard Libraries
import cgi, json, pickle
import cgitb, os


cgitb.enable()

form = cgi.FieldStorage()
file = form['photo'].file.file
name = form['photo'].filename

#Get DataTable object, and convert rows to JSON
table = DataTableFactory.getDataTable(fileStream=file, fileName=name)
jsonRows = table.getRowsAsJSON()

pickle.dump(jsonRows, open(os.path.abspath(__file__).replace(__file__, name + ".p"), "w"))
		
print ''
print json.dumps({'columns': [col for col in table.getColumnNames() if col], 'fileName': name})