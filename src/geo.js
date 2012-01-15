/**
 * Geo.js
 * https://github.com/mayconbordin/geo.js
 *
 * @author mayconbordin <mayconbordin@gmail.com>
 * ---------------------------------------------
 * 
 * Based on geo-location-javascript:
 * url: http://code.google.com/p/geo-location-javascript/
 * author: Stan Wiechers
 *
 * And locate_me:
 * url: https://github.com/rmoriz/locate_me
 * author: rmoriz
 */
var Geo = (function() {
	var provider = null;
	
	return {
		init: function(def) {
			if (typeof(def) != "undefined")
				this.setLocationProvider(def);
			else
				this.autoSetLocationProvider();
				
			return provider != null;
		},
		
		
		// W3C API methods =====================================================
		getCurrentPosition: function(successCallback, errorCallback, options) {
			provider.getCurrentPosition(successCallback, errorCallback, options);
		},
		
		watchPosition: function(successCallback, errorCallback, options) {
			provider.watchPosition(successCallback, errorCallback, options);
		},
		
  		clearWatch: function(watchId) {
			this.provider.clearWatch(watchId);
		},
		
		/**
		 * Get the device's IP address
		 *
		 * @param {function} successCallback
		 * @param {function} errorCallback
		 */
		getIPAddress: function(successCallback, errorCallback) {
			var ipProvider = new Geo.IPProvider.JSONIP();
			ipProvider.getIP(successCallback, errorCallback);
		},
		
		/**
		 * Automatically sets the location provider following the providers vector order
		 */
		autoSetLocationProvider: function() {
			for (var p in Geo.LocationProvider) {
				if (p != 'Base' && Geo.LocationProvider[p].available()) {
					this.setLocationProvider(new Geo.LocationProvider[p]());
					break;
				}
			}
		},
		
		/**
		 * Set the location provider that the library will use
		 *
		 * @param {String|Object} p The location provider to be setted
		 * @throws if provider does not exists
		 */
		setLocationProvider: function(p) {
			if (typeof(p) == "string") {
				if (typeof(Geo.LocationProvider[p]) != "undefined" && Geo.LocationProvider[p].available())
					provider = new Geo.LocationProvider[p]();
				else
					this.autoSetLocationProvider();
			} else
				provider = p;
		}
	};
})();

Geo.Coordinates = Class.extend({
	latitude: null,
	longitude: null,
	altitude: null,
	accuracy: null,
	altitudeAccuracy: null,
	heading: null,
	speed: null
});

Geo.Address = Class.extend({
	street_code: null,
	street_name: null,
	city: null,
	region_code: null,
	region_name: null,
	metrocode: null,
	zipcode: null,
	country_code: null,
	country_name: null,
	continent_code: null,
	dma_code: null,
	area_code: null
});

Geo.Position = Class.extend({
	coords: null,
	address: null,
	timestamp: null,
	ip: null,
	
	init: function(p) {
		this.coords = new Geo.Coordinates();
		this.address = new Geo.Address()
		
		if (typeof(p) != "undefined") {
			this.merge(p);
		}
	},
	
	/**
	 * Compares the latitude and longitude attributes of this object with a
	 * given object.
	 *
	 * @param {Geo.Position} p The position object to be compared
	 * @return {boolean} True if equal, false otherwise
	 */
	equals: function(p) {
		if (p == null)
			return false;
			
		if (p.coords.latitude == this.coords.latitude 
				&& p.coords.longitude == this.coords.longitude)
			return true;
		return false;
	},
	
	/**
	 * Merges with object containing positioning data.
	 * Covers W3C API, Gears, Mozilla Geode and Mojo.
	 * Overwrite this to handle specific implementations.
	 *
	 * @param {Object} p The position object to be merged
	 */
	merge: function(p) {
		var coords = (typeof(p.coords) != "undefined") ? p.coords : p;
		for (attr in coords)
			if (typeof(this.coords[attr]) != "undefined")
				this.coords[attr] = coords[attr];
				
		for (attr in p)
			if (typeof(this.address[attr]) != "undefined")
				this.address[attr] = p[attr];

		if (typeof(p.timestamp) != "undefined")
			this.timestamp = p.timestamp;
			
		if (typeof(p.ip) != "undefined")
			this.ip = p.ip;
	},
	
	geocode: function(callback, provider) {
		Geo.CodingProvider.getInstance(provider).geocode(this, callback);
	}
});

// =============================================================================
// IP Providers
// =============================================================================
Geo.IPProvider = {};
Geo.IPProvider.Base = Class.extend({
	getIP: function(successCallback, errorCallback) {
		JSONP.get(this.url, {}, function(data) {
			successCallback(data.ip);
		}, errorCallback);
	}
});
Geo.IPProvider.JSONIP = Geo.IPProvider.Base.extend({
	url: 'http://jsonip.appspot.com/'
});

// =============================================================================
// Geocoding Providers
// =============================================================================
Geo.CodingProvider = {
	instance: null,
	getInstance: function(p) {
		if (typeof(p) != 'undefined' && typeof(Geo.CodingProvider[p]) != 'undefined')
			this.instance = new Geo.CodingProvider[p]();
		else if (typeof(p) == 'object' && p.geocode)
			this.instance = p;
		else if (this.instance == null)
			for (cp in Geo.CodingProvider)
				if (this.isValid(cp) && Geo.CodingProvider[cp].available()) {
					this.instance = new Geo.CodingProvider[cp]();
					break;
				}
					
		return this.instance;
	},
	
	isValid: function(cp) {
		var invalid = ['providers', 'instance', 'getInstance', 'isValid'];
		for (i in invalid)
			if (cp == invalid[i])
				return false;
		return true;
	}
};

// Google Geocoding Provider ===================================================
Geo.CodingProvider.Google = Class.extend({
	provider: null,
	init: function() {
		this.provider = new google.maps.Geocoder();
	},
	geocode: function(p, callback) {
		var pos = new google.maps.LatLng(p.coords.latitude, p.coords.longitude);
		this.provider.geocode({'latLng': pos}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK)
				if (results[0]) {
					if (callback) callback(results[0]);
					p.address = results[0];
				}
		});
	}
});
Geo.CodingProvider.Google.available = function() {
	if (typeof(google) != 'undefined' && typeof(google.maps) != 'undefined')
		return true;
	return false;
};

// GeoNames Geocoding Provider =================================================
Geo.CodingProvider.GeoNames = Class.extend({
	url: 'http://api.geonames.org/findNearbyPlaceNameJSON',
	geocode: function(p, callback) {
		var params = {
			lat: p.coords.latitude,
			lng: p.coords.longitude,
			username: Geo.CodingProvider.GeoNames.username
		};
		
		JSONP.get(this.url, params,
			function(results) {
				if (results.geonames && results.geonames[0]) {
					if (callback) callback(results.geonames[0]);
					p.address = results.geonames[0];
				}
			}
		);
	}
});
Geo.CodingProvider.GeoNames.available = function() {
	return true;
};
Geo.CodingProvider.GeoNames.username = 'demo';

// Nominatim Geocoding Provider ================================================
Geo.CodingProvider.Nominatim = Class.extend({
	url: 'http://nominatim.openstreetmap.org/reverse',
	geocode: function(p, callback) {
		var params = {
			format: 'json',
			lat: p.coords.latitude,
			lon: p.coords.longitude,
			zoom: '18',
			addressdetails: '1'
		};
		
		JSONP.get(this.url, params,
			function(results) {
				if (results && results.address) {
					var address = results.address;
					address.display_name = results.display_name;
					
					if (callback) callback(address);
					p.address = address;
				}
			}, null, 'json_callback'
		);
	}
});
Geo.CodingProvider.Nominatim.available = function() {
	return true;
};

// =============================================================================
// GeoLocation Providers
// =============================================================================
Geo.LocationProvider = {};
Geo.LocationProvider.Base = Class.extend({
	provider: null,
	lastPos: null,
	
	getCurrentPosition: function(successCallback, errorCallback, options) {
		var _this = this;
		this.provider.getCurrentPosition(function(p) {
			successCallback(_this.parseResult(p));
		}, errorCallback, options);
	},
	
	parseResult: function(p) {
		return new Geo.Position(p);
	},
	
	// W3C implementation of position watcher
	_watchPosition: function(successCallback, errorCallback, options) {
		var _this = this;
		this.provider.watchPosition(function(p) {
			successCallback(_this.parseResult(p));
		}, errorCallback, options);
	},
	
	_clearWatch: function(watchId) {
		this.provider.clearWatch(watchId);
	},
	
	// Alternative implementation of position watcher (Default)
	watchPosition: function(successCallback, errorCallback, options) {
		var _this = this;
		this.positionWatcher(successCallback, errorCallback, options);
		
		return setInterval(function() {
			_this.positionWatcher(successCallback, errorCallback, options);
		}, 1000);
	},
	
	clearWatch: function(watchId) {
		clearInterval(watchId);
	},
	
	positionWatcher: function(successCallback, errorCallback, options) {
		var _this = this;
		this.getCurrentPosition(function(p) {
			if (!p.equals(_this.lastPos))
				successCallback(p);
			_this.lastPos = p;
		}, errorCallback, options);
	},
	
	processMap: function(map, src) {
		var obj = {};
		for (attr in map)
			obj[map[attr]] = src[attr];
		return obj;
	}
});

// W3C Provider ================================================================
Geo.LocationProvider.W3C = Geo.LocationProvider.Base.extend({
	init: function() {
		this.provider = navigator.geolocation;
	},
	watchPosition: function(successCallback, errorCallback, options) {
		this._watchPosition(successCallback, errorCallback, options);
	},
  	clearWatch: function(watchId) {
  		this._clearWatch(watchId);
  	}
});
Geo.LocationProvider.W3C.available = function() {
	if (typeof(navigator.geolocation) != "undefined")
  		return true;
	return false;
};

// Gears Provider ==============================================================
Geo.LocationProvider.Gears = Geo.LocationProvider.W3C.extend({
	init: function() {
		this.provider = google.gears.factory.create('beta.geolocation');
	}
});
Geo.LocationProvider.Gears.available = function() {
	if (typeof(window.google) != "undefined" && typeof(google.gears) != "undefined")
		return true;
	return false;
};

// Bondi Provider ==============================================================
Geo.LocationProvider.Bondi = Geo.LocationProvider.W3C.extend({
	init: function() {
		this.provider = bondi.geolocation;
	}
});
Geo.LocationProvider.Bondi.available = function() {
	if (typeof(bondi) != "undefined" && typeof(bondi.geolocation) != "undefined")
  		return true;
	return false;
};

// Mojo Provider ===============================================================
Geo.LocationProvider.Mojo = Geo.LocationProvider.Base.extend({
	getCurrentPosition: function(successCallback, errorCallback, options) {
		var _this = this;
        var parameters = {};
        if (options) {
            if (options.enableHighAccuracy && options.enableHighAccuracy == true)
          		parameters.accuracy = 1;
            
            if (options.maximumAge)
            	parameters.maximumAge = options.maximumAge;
            
            if (options.responseTime) {
            	if (options.responseTime < 5)
                	parameters.responseTime = 1;
                else if (options.responseTime < 20)
                	parameters.responseTime = 2;
                else
                	parameters.timeout = 3;
             }
        }

        r = new Mojo.Service.Request('palm://com.palm.location', {
        	method: "getCurrentPosition",
            parameters: parameters,
            onSuccess: function(p) {
            	successCallback(_this.parseResult(p));
            },
            onFailure: function(e) {
            	errorCallback(_this.parseError(e));
            }
        });
  	},
  	
  	parseError: function(e) {
  		if (e.errorCode == 1)
        	return {code: 3, message: "Timeout"};
        else if (e.errorCode == 2)
        	return {code: 2, message: "Position Unavailable"};
        else
            return {code: 0, message: "Unknown Error: webOS-code" + errorCode};
  	}
});
Geo.LocationProvider.Mojo.available = function() {
	if (typeof(Mojo) != "undefined" && typeof(Mojo.Service.Request) != "Mojo.Service.Request")
		return true;
	return false;
};

// Nokia Provider ==============================================================
Geo.LocationProvider.Nokia = Geo.LocationProvider.Base.extend({
	init: function() {
		this.provider = device.getServiceObject("Service.Location", "ILocation");
	},
	
	getCurrentPosition: function(successCallback, errorCallback, options) {
		var _this = this;
		
        function callback(transId, eventCode, result) {
        	if (eventCode == 4)
        		errorCallback({code: 2, message: "Position unavailable"});
        	else {
                successCallback(_this.parseResult(result));
            }
        }
        
        //location criteria
        var criteria = new Object();
        criteria.LocationInformationClass = "BasicLocationInformation";
        
        //make the call
        this.provider.ILocation.GetLocation(criteria, callback);
  	},
  	
  	parseResult: function(p) {
  		var result = {
    		latitude:  p.ReturnValue.Latitude,
    		longitude: p.ReturnValue.Longitude,
    		altitude:  p.ReturnValue.Altitude,
    		heading:   p.ReturnValue.Heading
        };
        
		return new Geo.Position(result);
	}
});
Geo.LocationProvider.Nokia.available = function() {
	if (typeof(device) != "undefined" && typeof(device.getServiceObject) != "undefined")
		return true;
	return false;
};

// BlackBerry Provider =========================================================
Geo.LocationProvider.BlackBerry = (function() {
	var bb_successCallback;
	var bb_errorCallback;
	var bb_blackberryTimeout_id = -1;

	function handleBlackBerryLocationTimeout() {
		if (bb_blackberryTimeout_id != -1)
			bb_errorCallback({message: "Timeout error", code: 3});
	}
	
	function handleBlackBerryLocation() {
			clearTimeout(bb_blackberryTimeout_id);
			bb_blackberryTimeout_id = -1;
			
		    if (bb_successCallback && bb_errorCallback) {
	            if(blackberry.location.latitude == 0 && blackberry.location.longitude == 0) {
                    //http://dev.w3.org/geo/api/spec-source.html#position_unavailable_error
                    //POSITION_UNAVAILABLE (numeric value 2)
                    bb_errorCallback({message:"Position unavailable", code:2});
	            } else {  
                    var timestamp = null;
                    
                    //only available with 4.6 and later
                    //http://na.blackberry.com/eng/deliverables/8861/blackberry_location_568404_11.jsp
                    if (blackberry.location.timestamp) {
                    	timestamp = new Date(blackberry.location.timestamp);
                    }
                    
                    bb_successCallback({
                    	timestamp: timestamp,
                    	coords: {
                    		latitude: blackberry.location.latitude,
                    		longitude: blackberry.location.longitude
                    	}
                    });
	            }
	            
	            //since blackberry.location.removeLocationUpdate();
	            //is not working as described
	            //http://na.blackberry.com/eng/deliverables/8861/blackberry_location_removeLocationUpdate_568409_11.jsp
	            //the callback are set to null to indicate that the job is done
	            bb_successCallback = null;
	            bb_errorCallback = null;
		    }
	}
	
	
	return Geo.LocationProvider.Base.extend({
		init: function() {
			// set to autonomous mode
			if(typeof(blackberry.location.setAidMode) == "undefined")
            	return false;
            	
			blackberry.location.setAidMode(2);
			provider = blackberry.location;
		},
		
		getCurrentPosition: function(successCallback, errorCallback, options) {
            //passing over callbacks as parameter didn't work consistently
            //in the onLocationUpdate method, thats why they have to be set
            //outside
            bb_successCallback = successCallback;
            bb_errorCallback   = errorCallback;
            
            //function needs to be a string according to
            //http://www.tonybunce.com/2008/05/08/Blackberry-Browser-Amp-GPS.aspx
			if (options['timeout']) {
				bb_blackberryTimeout_id = setTimeout("handleBlackBerryLocationTimeout()", options['timeout']);
			}
			
			//default timeout when none is given to prevent a hanging script
			else {
				bb_blackberryTimeout_id=setTimeout("handleBlackBerryLocationTimeout()",60000);
			}
			
			blackberry.location.onLocationUpdate("handleBlackBerryLocation()");
            blackberry.location.refreshLocation();
	  	}
	});
});
Geo.LocationProvider.BlackBerry.available = function() {
	if (typeof(window.blackberry) != "undefined" && blackberry.location.GPSSupported)
		return true;
	return false;
};

// IP Base Provider ============================================================
Geo.LocationProvider.IPBase = Geo.LocationProvider.Base.extend({
	url: null,
	params: null,
	cbname: null,
	getCurrentPosition: function(successCallback, errorCallback, options) {
		var _this = this;
		
		JSONP.get(this.url, this.params,
			function(p) {
				successCallback(_this.parseResult(p));
			},
			function() {
				errorCallback({code: 3, message: "Timeout"});
			}, this.cbname
		);
	}
});

// FreeGeoIp Provider ==========================================================
Geo.LocationProvider.FreeGeoIp = Geo.LocationProvider.IPBase.extend({
	url: 'http://freegeoip.net/json/'
});
Geo.LocationProvider.FreeGeoIp.available = function() {
	return true;
};

// GeoIpPidgets Provider =======================================================
Geo.LocationProvider.GeoIpPidgets = Geo.LocationProvider.IPBase.extend({
	url: 'http://geoip.pidgets.com/',
	params: {format: 'json'},
	
	parseResult: function(p) {
  		p.zipcode 		= p.postal_code;
  		p.region_name 	= p.region;
		return new Geo.Position(p);
	}
});
Geo.LocationProvider.GeoIpPidgets.available = function() {
	return true;
};

// GeoPlugin Provider ==========================================================
Geo.LocationProvider.GeoPlugin = Geo.LocationProvider.IPBase.extend({
	url: 'http://www.geoplugin.net/json.gp',
	cbname: 'jsoncallback',
	
	parseResult: function(p) {
  		var map = {
			geoplugin_city: 'city',
			geoplugin_areaCode: 'area_code',
			geoplugin_dmaCode: 'dma_code',
			geoplugin_countryCode: 'country_code',
			geoplugin_countryName: 'country_name',
			geoplugin_continentCode: 'continent_code',
			geoplugin_latitude: 'latitude',
			geoplugin_longitude: 'longitude',
			geoplugin_regionCode: 'region_code',
			geoplugin_regionName: 'region_name'
		};
		
		return new Geo.Position(this.processMap(map, p));
	}
});
Geo.LocationProvider.GeoPlugin.available = function() {
	return true;
};
