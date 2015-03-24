/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 *
 * TODO :
 *     - files extensions matching optimisation
 *     - add optimised mode that do not return deep chain handle for any HTTP verb (to be used when stores are used from within a chain)
 *     - check range object usage in chain
 *
 *
 *
 * - CLONE STORES : reset and initialised = false
 */

if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(["require", "deepjs/deep"], function(require, deep) {

	/**
	 * Empty class : Just there to get instanceof working (be warning with iframe issue in that cases).
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
		this._deep_store_ = true;
	};



	Store.prototype = {
		_deep_restrictable_: ["get", "range", "post", "put", "patch", "del", "rpc", "bulk"]
	};


	//deep.extensions = [];
	/**
     * start chain setted with a certain store
     * @example
     *
     * Store("json").get("/campaign/").log();
     
     *  ...
     *  Store("campaign").get("?").log()
     *
     *
     * @class Store
     * @constructor
     */
	Store.start = function(store) {
		//console.log("Store(name) : ", name)
		return deep(store || {})
			.done(function() {
				if (!this._storeDef)
					this.restful(store);
			})
			.done(function(s) {
				//console.log("store init trough chain : ", handler.provider);
				this._state.nodes = [deep.nodes.root(s)];
			});
	};

	deep.Store = Store;
	deep.client = {};
	deep.store = {};

	return Store;
});