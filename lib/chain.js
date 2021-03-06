/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}
define(["require", "./store", "deepjs/deep"],
	function(require, Store, deep) {
		"use strict";
		var createWithBody = function(verb) {
			return function(object, options) {
				var self = this;
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var method = store[verb];
						if (method && method._deep_ocm_)
							method = method();
						if (!method)
							return deep.errors.MethodNotAllowed("provided store doesn't have " + verb + ". aborting POST !");
						object = object ||  s;
						if (object && object._deep_query_node_)
							object = object.value;
						return deep.when(method.call(store, object, options))
							.done(function(success) {
								self._state.nodes = [deep.utils.nodes.root(success)];
							});
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			};
		};

		var proto = {
			range: function(start, end, query, options) {
				var self = this;
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var method = store.range;
						if (method && method._deep_ocm_)
							method = method();
						if (!method)
							return deep.errors.MethodNotAllowed("provided store doesn't have RANGE. aborting RANGE !");
						return deep.when(method.call(store, start, end, query, options))
							.done(function(success) {
								if (success._deep_range_)
									self._state.nodes = [deep.utils.nodes.root(success.results)];
								else
									self._state.nodes = [deep.utils.nodes.root(success)];
							});
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			},
			getAll: function(array, options) {
				var promises = [];
				for (var i = 0, len = array.length; i < len; ++i)
					promises.push(this.get(array[i], options));
				return deep.all(promises);
			},
			get: function(id, options) {
				var self = this;
				if (id == "?" || !id)
					id = "";
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var method = store.get;
						if (method && method._deep_ocm_)
							method = method();
						if (!method)
							return deep.errors.MethodNotAllowed("provided store doesn't have GET. aborting GET !");
						if (id[0] == "*")
							id = id.substring(1);
						return deep.when(method.call(store, id, options))
							.done(function(success) {
								//console.log("Deep store chain Get success : ", success);
								if (success && success._deep_range_)
									self._state.nodes = [deep.utils.nodes.root(success.results, null, {
										uri: id
									})];
								else
									self._state.nodes = [deep.utils.nodes.root(success, null, {
										uri: id
									})];
							});
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			},
			post: createWithBody("post"),
			put: createWithBody("put"),
			patch: createWithBody("patch"),
			del: function(id, options) {
				var self = this;
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var method = store.del;
						if (method && method._deep_ocm_)
							method = method();
						if (!method)
							return deep.errors.MethodNotAllowed("provided store doesn't have DEL. aborting DELETE !");
						id = id ||  s;
						if (id && id._deep_query_node_)
							id = id.id;
						return deep.when(method.call(store, id, options))
							.done(function(success) {
								self._state.nodes = [deep.utils.nodes.root(success)];
							});
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			},
			rpc: function(method, args, uri, options) {
				var self = this;
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var action = store.rpc;
						if (action && action._deep_ocm_)
							action = action();
						if (!action)
							return deep.errors.MethodNotAllowed("provided store doesn't have RPC. aborting RPC !");

						return deep.when(action.call(store, method, args, uri, options))
							.done(function(success) {
								self._state.nodes = [deep.utils.nodes.root(success)];
							});
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			},
			flush: function() {
				var self = this;
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var action = store.flush;
						if (action && action._deep_ocm_)
							action = action();
						if (!action)
							return deep.errors.MethodNotAllowed("provided store doesn't have flush. aborting !");
						return action.call(store);
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			},
			bulk: function(arr, uri, options) {
				var self = this;
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var method = store.bulk;
						if (method && method._deep_ocm_)
							method = method();
						if (!method)
							return deep.errors.MethodNotAllowed("provided store doesn't have BULK. aborting BULK !");
						return deep.when(method.call(store, arr, uri, options))
							.done(function(success) {
								self._state.nodes = [deep.utils.nodes.root(success)];
							});
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			},
			count: function(callback) {
				var self = this;
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var method = store.count;
						if (method && method._deep_ocm_)
							method = method();
						if (!method)
							return deep.errors.MethodNotAllowed("provided store doesn't have COUNT. aborting !");
						return deep.when(method.call(store))
							.done(callback);
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			},
			roles: deep.compose().after(function() {
				var self = this;
				var func = function(s, e) {
					self._store = null;
				};
				func._isDone_ = true;
				return self._enqueue(func);
			}),
			modes: deep.compose().after(function() {
				var self = this;
				var func = function(s, e) {
					self._store = null;
				};
				func._isDone_ = true;
				return self._enqueue(func);
			}),
			relation: function(rel, obj, opt) {
				var self = this;
				var func = function(s, e) {
					obj = obj ||  s;
					if (!obj)
						return null;
					var doIt = function(store) {
						self._store = store;
						var method = store.relation;
						if (method && method._deep_ocm_)
							method = method();
						if (!method)
							return deep.errors.MethodNotAllowed("provided store doesn't have 'relation' method !");
						if (obj._deep_array_) {
							var promises = [];
							obj.forEach(function(ob) {
								promises.push(method.call(store, rel, ob, opt))
							});
							return deep.all(promises);
						}
						if (obj._deep_query_node_)
							return method.call(store, rel, obj.value, opt);
						return method.call(store, rel, obj, opt);
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			},
			first: function(uri, opt) {
				var self = this;
				var func = function(s, e) {
					var doIt = function(store) {
						self._store = store;
						var method = store.first;
						if (method && method._deep_ocm_)
							method = method();
						if (!method)
							return deep.errors.MethodNotAllowed("provided store doesn't have 'first' method!");
						return method.call(store, uri, opt);
					};
					if (self._storeDef && !self._store)
						return deep.when(deep.protocol(self._storeDef)).done(doIt);
					return doIt(self._store);
				};
				func._isDone_ = true;
				return self._enqueue(func);
			}
		};

		var constructor = function(state, store) {
			this._identity = Chain;
			if (store._deep_request_)
				this._storeDef = store.provider;
			else
				this._storeDef = store;
			var self = this;
			var func = function(s, e) {
				return deep.when(deep.protocol(self._storeDef))
					.done(function(st) {
						self._store = st;
					});
			};
			func._isDone_ = true;
			this._enqueue(func);
		};
		deep.Promise._up({
			restful: function(store) {
				var handler = new Chain(this._state, store);
				this._enqueue(handler);
				return handler;
			}
		});
		var Chain = deep.Classes(deep.Promise, constructor, proto);
		Chain.start = function(store) {
			return new Chain(null, store).resolve();
		};
		deep.restful = Chain.start;
		return Chain;
	});