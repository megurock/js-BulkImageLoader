/*
The MIT License (MIT)

Copyright (c) 2014 megurock.net

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function(window) {

	'use strict';
	
	//--------------------------------------------------------------------------------------------
	// Public Properties
	//--------------------------------------------------------------------------------------------	
	BulkImageLoader.maxConnections = 3;


	// -------------------------------------------------------------------------------------------
	// Constructor
	// -------------------------------------------------------------------------------------------
	/**
	 * @param manifest:Array ex.) [ { src:String, id:Stirng(optional) }, ... ]
	 */
	function BulkImageLoader(manifest) {
		var _manifest = manifest;
		var _results = [];
		this.getManifest = function() { return _manifest; };
		this.getResults = function() { return _results; }
	}
		
	var p = BulkImageLoader.prototype;


	// --------------------------------------------------------------------------------------------
	// Public Methods
	// --------------------------------------------------------------------------------------------
	/**
	 *  @param args.onLoad:Function (optional)
	 *  @param args.onError:Function (optional)
	 *  @param args.onComplete:Function (optional)
	 *  @param args.maxConnections:uint (optional)
	 *  @param args.preventCache:Boolean (optional)
	 */
	p.load = function(args) {
		var manifest = this.getManifest();
		var onLoad = args.onLoad;
		var onError = args.onError;
		var onComplete = args.onComplete;
		var preventCache = args.preventCache;
		var maxConnections = !(args.maxConnections) ? BulkLoader.maxConnections : args.maxConnections;
		var _results = this.getResults();
		var _countConnections = 0;	
		var _countLoadStart = 0;
		var _manifestLength = manifest.length;

		/**
		 *
		 */
		var hasNext = function() {
			return _countLoadStart < _manifestLength;
		};

		/**
		 *
		 */
		var onResult = function(info, image, status) {
			_results.push({ src: info.src, id: info.id, image: image, status:status });
			if (hasNext()) {
				loadNext(loadNext);
			} else {
				if (_results.length === _manifestLength) {
					onLoadComplete();
				}
			}
		};

		/**
		 *
		 */
		var onLoadComplete = function() {
			if (typeof onComplete === 'function') {
				// sort loaded images in manifest order
				var temp = _results.concat();
				_results.length = 0;

				for (var i = 0; i < _manifestLength; i++) {
					var info = manifest[i];
					var key = info.id ? 'id' : 'src';
					for (var j = 0, len = temp.length; j < len; j++) {
						var resultObj = temp[j];
						if (info[key] === resultObj[key]) {
							_results.push(resultObj);
							temp.splice(j, 1);
							break;
						}
					}
				}
				onComplete(_results);
			};
		};

		/**
		 *
		 */
		var loadNext = function() {
			var info = manifest.shift();
			manifest.push(info);
			++_countLoadStart;

			new ImageLoader(info.src).load({
					onLoad: function(image) {
						if (typeof onLoad === 'function') {
							onLoad(image, info.id);
						}
						onResult(info, image, 'success');
					},
					onError: function(image) {
						if (typeof onError === 'function') {
							onError(image, info.id);
						}
						onResult(info, image, 'error');
					},
					preventCache: preventCache
				}
			);
		};

		// start loading
		for (var i = 0; i < maxConnections; i++) {
			hasNext() && loadNext();
		}

		return this;
	};

	/**
	 * @param id:String
	 */
	p.getResult = function(id) {
		var results = this.getResults(),
			theResult;
		for (var i = 0, len = results.length; i < len; i++) {
			var result = results[i];
			if (result.id === id) {
				theResult = result;
				break;
			}
		}
		return theResult;
	};

	window.BulkImageLoader = BulkImageLoader;


	// --------------------------------------------------------------------------------------------
	// Internal Class
	// --------------------------------------------------------------------------------------------
	/**
	 * Constuctor
	 * @param src:String
	 */
	function ImageLoader(src) {
		var _src = src;
		this.getSrc = function() { return _src; };
	}
	

	var p = ImageLoader.prototype;
	// --------------------------------------------------------------------------------------------
	// Public Methods
	// --------------------------------------------------------------------------------------------
	/**
	 *  @param args.onLoad:Function
	 *  @param args.onError:Function
	 *  @param args.preventCache:Boolean
	 */
	p.load = function(args) {
		var image = new Image();
		var src = this.getSrc();
		var query = (args.preventCache) ? ((src.indexOf('?') !== -1) ? '&' : '?') + new Date().getTime() : "";		
		image.src = src + query;

		// image src has to be specified before adding event listeners in Safari
		image.onload = function() {
			// for IE
			if (document.uniqueID) {
				var tmp = image;
				image = new Image();
				image.src = tmp.src;
			}
			excuteCallback(args.onLoad, image);
		};

		image.onerror = function() {
			excuteCallback(args.onError, image);
		}

		return this;
	};

		
	// --------------------------------------------------------------------------------------------
	// Internal Methods
	// --------------------------------------------------------------------------------------------
	var excuteCallback = function(callback, image) {
		if (typeof callback === 'function') {
			callback(image);
		}
	};

}(window));

