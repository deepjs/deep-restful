/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 * Base Class for Restful Stores.
 */

if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(["require", "deepjs/deep"], function(require, deep) {

	/**
	 * @class Store
	 * @constructor
	 */
	var Store = function(protocol) {
		//console.log("Store : protocol : ", protocol);
		if (protocol && typeof protocol === 'object')
			deep.aup(protocol, this);
		else
			this.protocol = protocol || this.protocol;

		if (this.protocol)
			deep.protocol(this.protocol, this);
	};

	Store.prototype = {
		_deep_store_ : true,
		_deep_restrictable_: ["get", "range", "post", "put", "patch", "del", "rpc", "bulk"]
	};

	deep.Store = Store;
	deep.store = {};

	return Store;
});