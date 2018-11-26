/*
**
** myProcess, proprietary property of AMPLEXOR
** (c) Copyright, AMPLEXOR Adriatic d.o.o. 2002-2016
** All rights reserved.
**
** May be used only in accordance with the terms and conditions of the
** license agreement governing use of AMPLEXOR software
** between you and AMPLEXOR or AMPLEXOR's authorized reseller.
** Not to be changed without prior written permission of AMPLEXOR.
** Any other use is strictly prohibited.
**
** $Revision: 1.8.14.1 $ 
** $Date: 2018/01/25 12:46:57 $
** $Author: euroscript\batusicr $
**
*/

define(function() {

    /*
     * Inherit
     */
	
	var inherit = function(ctor, superCtor, protoProps) {
		ctor.superconstructor = superCtor;
		
		ctor.prototype = Object.create(superCtor.prototype, {
			constructor: {
				value: ctor,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		
		if (protoProps) {
			Object.keys(protoProps).forEach(function(key) {
				ctor.prototype[key] = protoProps[key];
			});
		}
	};
	
    /*
     * Extend
     */
	
	var extend = function(target) {
		var length = arguments.length,
			i = 1;
		
		for (i; 1 < length ? i < length : i > length; 1 < length ? i++ : i--) {
			for (var prop in arguments[i]) {
				target[prop] = arguments[i][prop];
			}
		}
		
		return target;	
	};
	
    /*
     * Event emitter
     */
	
	var eventEmitter = function(obj) {
		obj = obj || {};
		
		if (typeof obj === 'function') {
			obj = obj.prototype;
		}

		obj.handlers = {};

		/**
		 * Add a listener
		 * @param {string} eventName The name of the event
		 * @param {function} handler The handler function for the event
		 * @param {boolean} front Handler is inserted at the front of the call chain when true
		 * @returns {object} This object for chaining
		 */
		obj.on = function (eventName, handler, front) {
			(obj.handlers[eventName] = obj.handlers[eventName] || [])[front ? 'unshift' : 'push'](handler);

			return obj;
		};

		/**
		 * Add a listener that will only be called once
		 * @param {string} eventName The name of the event
		 * @param {function} handler The handler function for the event
		 * @param {boolean} front Handler is inserted at the front of the call chain when true
		 * @returns {object} This object for chaining
		 */
		obj.once = function (eventName, handler, front) {
			// create a wrapper listener, that will remove itself after it is called
			function wrappedHandler() {
				// remove ourself, and then call the real handler with the args passed to this wrapper
				handler.apply(obj.off(eventName, wrappedHandler), arguments);
			}

			wrappedHandler.h = handler;

			// call the regular add listener function with our new wrapper
			return obj.on(eventName, wrappedHandler, front);
		};

		/**
		 * Remove a listener. Remove all listeners for eventName if handler is
		 * omitted. Remove all listeners for all event names if eventName is also
		 * omitted.
		 * @param {string} eventName The name of the event
		 * @param {function} handler The handler function for the event
		 * @returns {object} This object for chaining
		 */
		obj.off = function (eventName, handler) {
			// if no eventName, clear all event handlers for all events
			if (eventName === undefined) {
				handlers = {};
				return obj;
			}
			
			var list = handler ? handlers[eventName] || [] : [];
			
			for (var i = 0; i < list.length; i++) {
				// either this item is the handler passed in, or this item is a wrapper for the handler passed in (once function).
				if (list[i] === handler || list[i].h === handler) {
					list.splice(i--, 1);
				}
			}

			// cleanup if no events for the eventName
			if (!list.length) {
				// remove the array for this eventname (if it doesn't exist then this isn't really hurting anything)
				delete handlers[eventName];
			}

			return obj;
		};

		/**
		 * Dispatches the named event, calling all registered handler functions. If
		 * any handler returns false, the event subsequent handlers are not called
		 * and false is returned; Otherwise, all handlers are called and true is
		 * returned.
		 * @param {string} eventName The name of the event to dispatch
		 * @returns {boolean} False if any handler returns false, true otherwise.
		 */
		obj.emit = function (eventName) {
			// loop through all handlers for this event name and call them all
			//		arguments is "array-like", so call slice() from list instead
			//		handlers can return false to cancel event
			//      copy list in case on()/off() are called during emit
			var list = obj.handlers[eventName] && obj.handlers[eventName].slice() || [],
				args = list.slice.call(arguments, 1);
			
			for (var i = 0; i < list.length; ++i) {
				if (list[i].apply(obj, args) === false) {
					return false;
				}
			}

			return true;
		};

		return obj;
	};
	
    /*
     * Promise interface
     */	
	
    function Promise() {
        this._callbacks = [];
    }

    Promise.prototype.then = function(func, context) {
        var p;
		
        if (this._isdone) {
            p = func.apply(context, this.result);
        } else {
            p = new Promise();
			
            this._callbacks.push(function () {
                var res = func.apply(context, arguments);
				
                if (res && typeof res.then === 'function') {
                    res.then(p.done, p);
				}
            });
        }
        return p;
    };

    Promise.prototype.done = function() {
        this.result = arguments;
        this._isdone = true;
		
        for (var i = 0; i < this._callbacks.length; i++) {
            this._callbacks[i].apply(null, arguments);
        }
		
        this._callbacks = [];
    };

    function join(promises) {
        var p = new Promise(),
			results = [],
			numdone, total;

        if (!promises || !promises.length) {
            p.done(results);
            return p;
        }

        numdone = 0;
        total = promises.length;

        function notifier(i) {
            return function() {
                numdone += 1;
                results[i] = Array.prototype.slice.call(arguments);
				
                if (numdone === total) {
                    p.done(results);
                }
            };
        }

        for (var i = 0; i < total; i++) {
            promises[i].then(notifier(i));
        }

        return p;
    }

    function chain(funcs, args) {
        var p = new Promise();
		
        if (funcs.length === 0) {
            p.done.apply(p, args);
        } else {
            funcs[0].apply(null, args).then(function() {
                funcs.splice(0, 1);
				
                chain(funcs, arguments).then(function() {
                    p.done.apply(p, arguments);
                });
            });
        }
		
        return p;
    }

    /*
     * AJAX requests
     */

    var requestTimeout = 0,
    	requestErrorCodes = {
			ENOXHR: 1,
	        ETIMEOUT: 2
	    },
	    requestTypes = {
    		html: 'text/html',
    		json: 'application/json',
    		xml: 'application/xml',
    		urlencoded: 'application/x-www-form-urlencoded'
    	};
    
    function encode(data) {
        var payload = "",
			params;
		
        if (typeof data === "string") {
            payload = data;
        } else {
            params = [];

            for (var k in data) {
                if (data.hasOwnProperty(k)) {
                    params.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
                }
            }
			
            payload = params.join('&')
        }
		
        return payload;
    }

    function newHttpRequest() {
        var xhr;
		
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
        }
		
        return xhr;
    }

    function ajax(method, url, data, options) {
        var p = new Promise(),
        	self = this,
			contentType = requestTypes.urlencoded,
			headers, xhr, payload, timeout, timeoutId;
		
		options = options || {};
        data = data || {};
        headers = options.headers || {};

        try {
            xhr = newHttpRequest();
        } catch (e) {
            p.done(requestErrorCodes.ENOXHR, "");
            return p;
        }

        payload = encode(data);
		
        if ((method === 'GET') && payload) {
			url += /\?/.test(url) ? '&' : '?';
            url += payload;
            payload = null;
        }

        xhr.open(method, url);
		
        for (var h in headers) {
            if (headers.hasOwnProperty(h)) {
                if (h.toLowerCase() === 'content-type') {
                    contentType = headers[h];
				} else {
                    xhr.setRequestHeader(h, headers[h]);
				}
            }
        }
		
        xhr.setRequestHeader('Content-type', contentType);
        
		if (contentType === requestTypes.json) {
			payload = data;
		}

        function onTimeout() {
            xhr.abort();
            p.done(requestErrorCodes.ETIMEOUT, "", xhr);
        }

        timeout = requestTimeout;
		
        if (timeout) {
            timeoutId = setTimeout(onTimeout, timeout);
        }

        xhr.onreadystatechange = function() {
			var err, responseText;
			
            if (timeout) {
                clearTimeout(timeoutId);
            }
			
            if (!self._isAborted && xhr.readyState === 4) {
                err = (!xhr.status || ((xhr.status < 200) || (xhr.status >= 300)) && (xhr.status !== 304));
                
                responseText = xhr.responseText;
                
                if (options.parseJSON || (xhr.getResponseHeader('Content-Type') === requestTypes.json)) {
                	responseText = JSON.parse(responseText);
                }
                
                p.done(responseText, xhr, err);
            }
            
            self._isAborted = false;
        };
        
        p.abort = function () {
        	if (xhr.readyState !== 4) {
        		self._isAborted = true;
        		xhr.abort();
        	}
        };

        xhr.send(payload);
		
        return p;
    }

    function helper(method) {
        return function(url, data, options) {
            return ajax(method, url, data, options);
        };
    }
    
    /* CSS helpers */
    function classReg(className) {
    	return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
	}
    
    var hasClass, addClass, removeClass;

    if ('classList1' in document.documentElement) {
    	hasClass = function(elem, c) {
    		return elem.classList.contains(c);
    	};
    	
    	addClass = function(elem, c) {
			elem.classList.add(c);
    	};
    	
    	removeClass = function(elem, c) {
    		elem.classList.remove(c);
    	};
    } else {
    	hasClass = function(elem, c) {
    		return classReg(c).test(elem.className);
    	};
    	
    	addClass = function(elem, c) {
    		if (!hasClass(elem, c)) {
    			elem.className = elem.className + ' ' + c;
    		}
    	};
    	
    	removeClass = function(elem, c) {
    		elem.className = elem.className.replace(classReg(c), ' ');
    	};
    }

    function toggleClass(elem, c) {
    	var fn = hasClass(elem, c) ? removeClass : addClass;
    	fn(elem, c);
    }
    
    /* Event helpers */
    
    function addEvent(element, eventType, listener, useCapture) {
		var paused, eventResult,
			eventKey = '_event_' + eventType;

		useCapture = useCapture || false;

		function addListener(listener) {
			element.addEventListener(eventType, listener, useCapture);

			return {
				remove: function() {
					element.removeEventListener(eventType, listener, useCapture);
				}
			};
		}

		eventResult = addListener(function() {
			if (!paused) {
				return listener.apply(this, arguments);
			}
		});

		eventResult.pause = function() {
			paused = true;
		};

		eventResult.resume = function() {
			paused = false;
		};
		
		eventResult.isPaused = function() {
			return paused;
		};
		
		element[eventKey] = eventResult;

		return eventResult;
	}

	return {
		inherit: inherit,
		extend: extend,
		eventEmitter: eventEmitter,
		Promise: Promise,
        join: join,
        chain: chain,
        request: {
	        ajax: ajax,
	        get: helper('GET'),
	        post: helper('POST'),
	        put: helper('PUT'),
	        del: helper('DELETE'),
	        /**
	         * Configuration parameter: time in milliseconds after which a pending request is considered unresponsive and is aborted. A value of 0 disables timeouts.
	         * Aborted requests resolve the promise with a ETIMEOUT error code.
	         */
	        setTimeout: function(reqTimeout) {
	        	requestTimeout = reqTimeout;
	        }
        },
        addClass: addClass,
        removeClass: removeClass,
        hasClass: hasClass,
        toggleClass: toggleClass,
        addEvent: addEvent
	};
});