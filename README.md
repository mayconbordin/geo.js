Geo.js
======

This is a Geolocation library based on [geo-location-javascript](http://code.google.com/p/geo-location-javascript/) and [Locate Me](https://github.com/rmoriz/locate_me).

It supports the same platforms as geo-location-javascript, that are:

* W3C Geolocation API
* iOS
* Android
* BlackBerry OS
* Browsers with Google Gears support
* Nokia Web Run-Time
* webOS Application Platform
* Torch Mobile Iris Browser
* Mozilla Geode

If none of this options are available, the library will try to retrieve the device's location by IP, using:

* freegeoip.net
* geoip.pidgets.com
* geoplugin.com

This library is very flexible, you can write your own location providers, use them as a fallback or set them as default. In the latter case, if your provider is not available, the library will choose another available option, and if it doesn't find any, it will then throw an error.

This library also supports reverse geocoding, the following providers are supported:

* Google Geocoding API
* Flickr Places API
* GeoNames
* Nominatim OpenStreetMap

### Usage ###

Include the gears_init.js, util.js and geo.js libraries in your html:


```html
<script src="http://code.google.com/apis/gears/gears_init.js"></script>
<script src="js/util.js"></script>
<script src="js/geo.js"></script>
```

Now you can start the library:


```javascript
Geo.init();
```

This is the default starter, the library will try to find the first available location provider to use. But you can give a provider to the initializer, as a string or object:


```javascript
Geo.init('W3C');

//or

Geo.init(new Geo.LocationProvider.W3C());
```

To get the user location you just do this:


```javascript
if (Geo.init()) {
	Geo.getCurrentPosition(function(p) {
		console.log(p);
	}, function(e) {
		console.log("Error " + e.code + ": " + e.message);
	});
}
```

### Methods ###

The `Geo` object will provide, besides the `init()`, the following methods:

* `getCurrentPosition(successCallback, errorCallback, options)` try to get the current position of the device, passing it to the successCallback. In case of error, errorCcallback is called.
* `watchPosition(successCallback, errorCallback, options)` the arguments work the same way as before. But this method will call the successCallback every time the device's position changes. It also returns an ID corresponding to the watcher. Some APIs have this method natively implemented, in these cases this library just redirects the call, but if the API has no support, the library uses an own implementation.
* `clearWatch(watchId)` stops the watcher created with the method above.

The `options` argument, is an object that can have one or more of those attributes:

* `boolean enableHighAccuracy`
* `long timeout`
* `long maximumAge`


Other methods:

* `getIPAddress()` returns the device's IP address.
* `autoSetLocationProvider()` automatically chooses the location provider.
* `setLocationProvider(p)` set the location provider to be used. Can be, as in the `init()` a string or object instance.


### Create your own Location Provider ###

This library has been built to enable the usage of custom location providers, the following example shows how to do that:

```javascript
// This is just a dummy provider
Geo.LocationProvider.MyProvider = Geo.LocationProvider.Base.extend({
	getCurrentPosition: function(successCallback, errorCallback, options) {
		successCallback(this.parseResult({
			latitude: -37,
			longitude: 11
		}));
	}
});
Geo.LocationProvider.MyProvider.available = function() {
	return true;
};

Geo.init('MyProvider');
```

Your location providers must be placed before the `Geo.init()` in order to be included in the provider auto selection. They also need to be created as an attribute of `Geo.LocationProvider` object to be registered.

### Default Providers ###

This is the list of the default providers:

* W3C
* Gears
* Bondi
* Mojo
* Nokia
* FreeGeoIp
* GeoIpPidgets
* GeoPlugin


### Geocoding Examples ###
Geo.js supports geocoding from an address to latitude and longitude, latitude longitude to address and IP to address.

```javascript
if (Geo.init()) {
	// Get the address from coordinates
	var position = new Geo.Position({latitude: 48.833, longitude: 2.333});
	position.geocode(function(addr) {
		console.log(position);
	});
	
	// Get the coordinates from an address
	var position = new Geo.Position({address: {formatted: 'Mouton-Duvernet, Paris, Ile de France, FR, France'}});
	position.geocode(function(addr) {
		console.log(position);
	});
	
	// Get the coordinates and address from an IP address
	var position = new Geo.Position({ip: '74.125.234.115'});
	position.geocode(function(addr) {
		console.log(position);
	});
}
```


### Reverse Geocoding ###

This library also support (reverse) geocoding providers. The `Geo.Position` object has a method for reversing geocoding his coordinates:

```javascript
Geo.init();
Geo.getCurrentPosition(success_callback);

function success_callback(p) {
	p.geocode(function(data) {
		console.log(p);
	});
}

// or

var position = new Geo.Position({latitude: 48.833, longitude: 2.333});
position.geocode(function(addr) {
	console.log(position);
	console.log(addr);
});
```

When you call the `geocode()` method, the callback is optional, because the function will set the address retrieved by geocoding in the `p` object. Although there is a `Geo.Address` object, it is not used when doing geocoding because the Google Geocoding API can return several address components [(see)](http://code.google.com/intl/en/apis/maps/documentation/geocoding/#Types).

Currently there is four geocoding providers available (`'Google', 'Flickr', 'GeoNames', 'Nominatim'`). When calling the `geocode()` method, you can also provide to the function the geocoding provider that you would like to use:

```javascript
p.geocode(function(data) {
	console.log(p);
}, 'Google');

// or

p.geocode(function(data) {
	console.log(p);
}, new Geo.CodingProvider.GeoNames());
```

In order to use the Google Geocoding API you need to include the GMaps library in your html:

```html
<script src="http://maps.google.com/maps/api/js?sensor=false"></script>
```

And if you're using the GeoNames service, you need to [create an account](http://www.geonames.org/login), login into your account and [enable free web services](http://www.geonames.org/manageaccount), and then inform the library what's your username:

```javascript
if (Geo.init()) {
	// provide your username to use the geonames web service
	Geo.RevCodeProvider.GeoNames.username = 'myusername';
	Geo.getCurrentPosition(success_callback, error_callback);

	function success_callback(p) {
		p.geocode(function(data) {
			console.log(data);
		}, 'GeoNames');
	}

	function error_callback(p) {
		console.log(p);
	}
}
```

For the Flickr API, you will need to [create an app](http://www.flickr.com/services/apps/create/) to get an app_key and use the reverse geocoding web service:

```javascript
if (Geo.init()) {
	// set your Flickr API key
	Geo.CodeProvider.Flickr.apiKey = 'your_api_key';
	
//...
}
```

You can also write your own geocoder:

```javascript
// My geocoder is using JSONP to call an external webservice
Geo.RevCodeProvider.MyGeocoder = Class.extend({
	// the url of my geocoder web service
	url: 'http://api.mygeocoder.com/',
	
	// this is the method called when geocode the Geo.Position object p
	// this method is mandatory
	geocode: function(p, callback) {
		this._jsonp(p, callback, {
			format: 'json',
			lat	  : p.coords.latitude,
			lng	  : p.coords.longitude
		});
	},
	
	// Check if the returned data is ok
	isResultOk: function(result) {
		return (result != null);
	},
	
	// If the ajax call succeeded, the the result data should
	// be set in the position object
	setResult: function(position, data) {
		position.merge({
			formatted: data.full_address,
			details: data
		});
	}
});

// here you check if the service is available
Geo.RevCodeProvider.MyGeocoder.available = function() {
	return true;
};
```

Like the location providers, the geocoding providers must be placed before the `Geo.init()` call. The geocoding provider must have at least two methods: `void geocode(Geo.Position p, function callback)` and `boolean available()`.

### References ###

* [W3C Geolocation API](http://www.w3.org/TR/geolocation-API/)
* [Gears Geolocation API](http://code.google.com/intl/pt-BR/apis/gears/api_geolocation.html)
* [BONDI Geolocation API](http://www.omtp.org/1.1/apis/geolocation.html)
* [FreeGeoIP](http://freegeoip.net/static/index.html)
* [Pidgets GeoIP](http://geoip.pidgets.com/)
* [geo-location-javascript](http://code.google.com/p/geo-location-javascript/)
* [Locate Me](https://github.com/rmoriz/locate_me)
* [Google Geocoding API](http://code.google.com/intl/en/apis/maps/documentation/geocoding/)
* [GeoNames](http://www.geonames.org/)
* [geoPlugin](http://www.geoplugin.com/)
* [Nominatim OpenStreetMap](http://wiki.openstreetmap.org/wiki/Nominatim#Reverse_Geocoding_.2F_Address_lookup)
* [Flickr API](http://www.flickr.com/services/api/)
