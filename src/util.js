/**
 * Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
(function() {
	var initializing = false,
		fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
		
	// The base Class implementation (does nothing)
	this.Class = function(){};

	// Create a new Class that inherits from this class
	Class.extend = function(prop) {
		var _super = this.prototype;

		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
		  	prototype[name] = (typeof prop[name] == "function") && 
				(typeof _super[name] == "function") && fnTest.test(prop[name]) ?
				(function(name, fn) {
			  		return function() {
						var tmp = this._super;
			
						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];
			
						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						var ret = fn.apply(this, arguments);        
						this._super = tmp;
			
						return ret;
			  		};
				})(name, prop[name]) : prop[name];
		}

		// The dummy class constructor
		function Class() {
			// All construction is actually done in the init method
			if (!initializing && this.init)
				this.init.apply(this, arguments);
		}

		// Populate our constructed prototype object
		Class.prototype = prototype;

		// Enforce the constructor to be what we expect
		Class.prototype.constructor = Class;

		// And make this class extendable
		Class.extend = arguments.callee;

		return Class;
	};
})();


/**
 * JSONP Plain JavaScript Library
 *
 * http://blog.eood.cn/jsonp-library-in-plain-javascript-with-timeout
 *
 * Example:
 * var url = 'http://blog.eood.cn/api';
 * var error = function() {alert('error');};
 * var success = function(data) {
 *     // process the data
 * };
 * JSONP.get( url, {'parm1': 'parm1_value', 'parm2': 'parm2_value'}, error, success);
 */
var JSONP = (function() {
    var counter = 0,
        head, query, key, window = this;

    function load(url) {
        var script = document.createElement('script');
        var done = false;
        script.src = url;
        script.async = true;

        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                done = true;
                script.onload = script.onreadystatechange = null;
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }
        };
        if (!head) {
            head = document.getElementsByTagName('head')[0];
        }
        head.appendChild(script);
    }

    function jsonp(url, params, callback, error, cbname) {
        query = "?";
        params = params || {};
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                query += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
            }
        }
        var jsonp = "json" + (++counter);
        window[jsonp] = function (data) {
            callback(data);
            try {
                delete window[jsonp];
            } catch (e) {}
            window[jsonp] = null;
        };

		cbname = cbname || "callback";
        load(url + query + cbname + "=" + jsonp);

        error = error ||
        function () {};

        window.setTimeout(function () {
            if (typeof window[jsonp] == "function") {

                // replace success with null callback in case the request is just very latent.
                window[jsonp] = function (data) {
                    try {
                        delete window[jsonp];
                    } catch (e) {}
                    window[jsonp] = null;
                };

                // call the error callback
                error();

                // set a longer timeout to safely clean up the unused callback.
                window.setTimeout(function () {
                    if (typeof window[jsonp] == "function") {
                        try {
                            delete window[jsonp];
                        } catch (e) {}
                        window[jsonp] = null;
                    };
                }, 120000);
            };
        }, 10000);

        return jsonp;
    }
    return {
        get: jsonp
    };
}());

var Util = {
	merge: function(a, b) {
		for (var attrname in b)
			a[attrname] = b[attrname];
		return a;
	}
};
