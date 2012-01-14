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

Include the gears_init.js and geo.js libraries in your html:


```html
<script src="http://code.google.com/apis/gears/gears_init.js"></script>
<script src="js/geo.js"></script>
```


