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
	var providers = ["W3C", "Gears", "Bondi", "Mojo", "Nokia", "FreeGeoIp", "GeoIpPidgets"];
	var provider = null;
	
	return {
		init: function(def) {
			if (typeof(def) != "undefined")
				this.setLocationProvider(def);
			else
				this.autoSetLocationProvider();
				
			if (provider == null)
				throw "There is no provider available";
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
		
		getIPAddress: function(successCallback, errorCallback) {
			var ipProvider = new Geo.IPProvider.JSONIP();
			ipProvider.getIP(successCallback, errorCallback);
		},
		
		/**
		 * Automatically sets the location provider following the providers vector order
		 */
		autoSetLocationProvider: function() {
			for (var i in providers) {
				var p = providers[i];
				if (Geo.LocationProvider[p].available()) {
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
		},
		
		registerLocationProvider: function(name) {
			providers.push(name);
		}
	};
})();

Geo.Position = Class.extend({
	init: function(p) {
		if (typeof(p) != "undefined") {
			this.merge(p);
		}
	},
	
	coords: {
		latitude: null,
		longitude: null,
		altitude: null,
		accuracy: null,
		altitudeAccuracy: null,
		heading: null,
		speed: null
	},
	
	address: {
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
	},
	
	timestamp: (new Date).getTime(),
	ip: null,
	
	/**
	 * Compares the latitude and longitude attributes of this object with a
	 * given object.
	 *
	 * @param {Geo.Position} p The position object to be compared
	 * @return {boolean} True if equal, false otherwise
	 */
	equals: function(p) {
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
	}
});

// =============================================================================
// IP Providers
// =============================================================================
Geo.IPProvider = {};
Geo.IPProvider.Base = Class.extend({
	getIP: function(successCallback, errorCallback) {
		JSONP.get(this.url, {}, errorCallback, function(data) {
			successCallback(data.ip);
		});
	}
});
Geo.IPProvider.JSONIP = Geo.IPProvider.Base.extend({
	url: 'http://jsonip.appspot.com/'
});

// =============================================================================
// Geocoding Providers
// =============================================================================
Geo.CodingProvider = {};


// =============================================================================
// GeoLocation Providers
// =============================================================================
Geo.LocationProvider = {};
Geo.LocationProvider.Base = Class.extend({
	provider: null,
	lastPos: null,
	
	available: function() {
		return false;
	},
	
	getCurrentPosition: function(successCallback, errorCallback, options) {
		var _this = this;
		this.provider.getCurrentPosition(function(p) {
			successCallback(_this.parseResult(p));
		}, errorCallback, options);
	},
	
	parseResult: function(p) {
		return new Geo.Position(p);
	},
	
	// Default implementation of position watcher
	watchPosition: function(successCallback, errorCallback, options) {
		this.provider.watchPosition(function(p) {
			successCallback(_this.parseResult(p));
		}, errorCallback, options);
	},
	
	clearWatch: function(watchId) {
		this.provider.clearWatch(watchId);
	},
	
	// Alternative implementation of position watcher
	_watchPosition: function(successCallback, errorCallback, options) {
		var _this = this;
		this._positionWatcher();
		
		return setInterval(function() {
			_this._positionWatcher();
		}, 1000);
	},
	
	_clearWatch: function(watchId) {
		clearInterval(watchId);
	},
	
	_positionWatcher: function(successCallback, errorCallback, options) {
		var _this = this;
		this.getCurrentPosition(function(p) {
			if (!p.equals(_this.lastPos)) {
				successCallback(p);
			}
		}, errorCallback, options);
	}
});

Geo.LocationProvider.Base.create = function(ref, struct, fixed) {
	var obj = Geo.LocationProvider.Base.extend(struct);
	
	for (attr in fixed)
		obj[attr] = fixed[attr];
		
	return obj;
};

// W3C Provider ================================================================
Geo.LocationProvider.W3C = Geo.LocationProvider.Base.extend({
	init: function() {
		this.provider = navigator.geolocation;
	}
});
Geo.LocationProvider.W3C.available = function() {
	if (typeof(navigator.geolocation) != "undefined")
  		return true;
	return false;
};

// Gears Provider ==============================================================
Geo.LocationProvider.Gears = Geo.LocationProvider.Base.extend({
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
Geo.LocationProvider.Bondi = Geo.LocationProvider.Base.extend({
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
  	},
  	
  	watchPosition: this._watchPosition,
  	clearWatch: this._clearWatch
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
	},
	
	watchPosition: this._watchPosition,
  	clearWatch: this._clearWatch
});
Geo.LocationProvider.Nokia.available = function() {
	if (typeof(device) != "undefined" && typeof(device.getServiceObject) != "undefined")
		return true;
	return false;
};

// BlackBerry Provider =========================================================
Geo.LocationProvider.BlackBerry = Geo.LocationProvider.Base.extend({
	init: function() {
		this.provider = device.getServiceObject("Service.Location", "ILocation");
	}
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
	getCurrentPosition: function(successCallback, errorCallback, options) {
		var _this = this;
		
		JSONP.get(_this.url, _this.params,
			function() {
				errorCallback({code: 3, message: "Timeout"});
			},
			function(p) {
				successCallback(_this.parseResult(p));
			}
		);
	},
	watchPosition: this._watchPosition,
  	clearWatch: this._clearWatch
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
