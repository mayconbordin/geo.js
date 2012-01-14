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

This library is very flexible, you can write your own location providers, use them as a fallback or set them as default. In the latter case, if your provider is not available, the library will choose another available option, and if it doesn't find any, it will then throw an error.

### Usage ###

Include the gears_init.js, util.js and geo.js libraries in your html:


```html
<script src="http://code.google.com/apis/gears/gears_init.js"></script>
<script src="js/util.js"></script>
<script src="js/geo.js"></script>
```

Now you can start the library:


```html
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
Geo.getCurrentPosition(function(p) {
	console.log(p);
}, function(e) {
	console.log("Error " + e.code + ": " + e.message);
});
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

* `autoSetLocationProvider()` automatically chooses the location provider.
* `setLocationProvider(p)` set the location provider to be used. Can be, as in the `init()` a string or object instance.
* `registerLocationProvider(name)` adds a new location provider to the list of providers.


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

Geo.registerLocationProvider('MyProvider');
Geo.init('MyProvider');
```


### Default Providers ###

This is the list of the default providers:

* W3C
* Gears
* Bondi
* Mojo
* Nokia
* FreeGeoIp
* GeoIpPidgets


### References ###

* [W3C Geolocation API](http://www.w3.org/TR/geolocation-API/)
* [Gears Geolocation API](http://code.google.com/intl/pt-BR/apis/gears/api_geolocation.html)
* [BONDI Geolocation API](http://www.omtp.org/1.1/apis/geolocation.html)
* [FreeGeoIP](http://freegeoip.net/static/index.html)
* [Pidgets GeoIP](http://geoip.pidgets.com/)
* [geo-location-javascript](http://code.google.com/p/geo-location-javascript/)
* [Locate Me](https://github.com/rmoriz/locate_me)
