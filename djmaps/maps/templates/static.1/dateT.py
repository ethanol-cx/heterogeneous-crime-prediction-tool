import datetime
import time
import json

with open('./dataCrime.json', "r+") as json_data:
	d = json.load(json_data)


for x in d["features"]:
	strTime = x["properties"]["time"]
	fltTime = float(strTime)
	intTime = int(fltTime)
	hourOfDay = int(float(strTime[6:]) * 24)

	cur = "0-0-0"
	if intTime > 366:
		cur = str(datetime.date.fromordinal(intTime - 366))
	formattedHour = str(hourOfDay)
	if hourOfDay < 10:
		formattedHour = '0' + str(hourOfDay)
	x["properties"]["time"] = str(cur) + 'T' + formattedHour + ':00:00Z'

with open('./dataCrime1.json', "w") as json_data:
	json.dump(d, json_data, indent=4, sort_keys=True, default=str)
	#print cur
	#F.write(cur)

