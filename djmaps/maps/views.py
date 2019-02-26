from django.shortcuts import render

# Create your views here.
def default_map(request):
	#TODO: move this token to Django settings from an environment variable
	#found in the Mapbox account settings and getting started instructions
	#see https://www.mapbox.com/account/ under the "Access tokens" section
	mapbox_access_token = 'pk.eyJ1Ijoia2F0aGxlZW54dWUiLCJhIjoiY2pyOXU5Z3JlMGxiNzQ5cGgxZmo5MWhzeiJ9.xyOwT8LWfjpOlEvPF2Iy7Qo'
	return render(request, 'default.html', {'mapbox_access_token': mapbox_access_token})
