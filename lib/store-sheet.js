/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * Complete common Restful store API.
 * This sheet should be applied on every real ressource client (not on http-client).
 *
 * Provides :
 * - common schema management (validation, privates, readOnly, transforms, owner, ...)
 * - add RPC and Bulk capabilities
 *
 * It wraps HTTP verbs (get, post, put, patch, del, range) from target store.
 * 
 * TODO : precompile schema for performance (privates, readOnly, ...)
 */

if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(["require", "deepjs/deep", "./store", "deepjs/lib/nodes/nodes"], function (require, deep, Store, nodes)
{	
	/**
	 * applyshcema constraints transformers (see constraints docs).
	 * For internal use normally.
	 * @param  {Object} object any object where applying transformers
	 * @param  {Object} schema the schema containing transformers references to apply.
	 * @return nothing
	 */
	deep.applyTransformers =  function(object, schema) {
		if (!object._deep_query_node_)
			object = nodes.root(object, schema);
		// console.log("apply Transform on : ", object, schema);
		var r = deep.query(object, ".//?_schema.transform", {
			fullOutput: true,
			schema: schema
		});
		if(r)
			r.forEach(function(node) {
				for (var i = 0, len = node.schema.transform.length; i < len; ++i)
					deep.utils.nodes.map(node, node.schema.transform[i]);
			});
	};

    var filterPrivate = Store.filterPrivate = function(method) {
        return function(old){
            return function(object, options) {
                //console.log("private check : ", this, object);
                var self = this, schema = self.schema;
                if (!schema)
                    return old.call(this, object, options);
                if(self._deep_object_)
                    schema = deep.utils.schemaByValuePath(schema, options.id+(options.path||""), '/');
                else if(options.path)
                    schema = deep.utils.schemaByValuePath(schema, options.path, '/');
                // remove privates from sended object (body) before applying action
                deep.utils.remove(object, ".//!?_schema.private=true", schema);
                return deep.when(old.call(this, object, options))
                .done(function(result){
                	// remove privates from action result.
                	//console.log('remove privates : ', result, schema);
                    deep.utils.remove(result, ".//!?_schema.private=true", schema);
                    return result; 
                });
            };
        };
    };

	var applyPut = function(item, query, object) {
		if(query)
		{
			deep.utils.replace(item, query, object);
			return item;
		}
		return object;
	};

	var applyPatch = function(item, query, object) {
		if(query)
		{
			var r = deep.query(item, query, { fullOutput:true, allowStraightQueries:false });
			r.forEach(function(entry){
				entry.value = deep.aup(object, entry.value);
				if(entry.ancestor)
					entry.ancestor.value[entry.key] = entry.value;
			});
		}
		else
			item = deep.aup(object, item);
		return item;
	};

	var putPatchHandler = function(method, handler){
		return function(object, options)
		{
			var id = options.id || object.id, query = options.path;
			if (!id)
				return deep.errors.Store("Store need id on " + method);
			var schema = this.schema,
				self = this;
			options.id = id;
			options.noPrivates = true;
			options.ownerRestriction = this.ownerRestriction?"full":null;
			
			return deep.when(this.get(id, options)) // check ownership + filter at get
			.done(function(r)
			{
				var oldObject = deep.utils.copy(r);
				r = handler(r, query, object);	// APPLY PUT/PATCH on 'old' datas
				if(schema)
				{
					//__________________________________________________ TRANSFORM FIELDS
					if(self.applyTransformers)
						self.applyTransformers(r, schema, options);
					else
						deep.applyTransformers(r, schema);
					//__________________________________________________ READONLY
					var check = self.checkReadOnly(oldObject, r, options, schema);
					if(check instanceof Error)
						return check;
					//__________________________________________________ VALIDATION
					var report = null;
					if(self.validate)
						report = self.validate(r, schema, options);
					else
						report = deep.validate(r, schema);
					if(!report.valid)
						return deep.errors.PreconditionFail("validation failed!", report);
				}
				return deep.Arguments([r, options]);
			});
		};
	};

	deep.utils.parseRestPath = function(path, parser) {
		if (path == '/')
			return {};
		if (parser) {
			var opt = parser.match(path);
			if (parser._deep_route_)
				opt = opt.output;
			return opt;
		}
		var options = {},
			splitted = path.split("/");
		if (path[0] === "/")
			splitted.shift();
		if (path[path.length - 1] == "/")
			splitted.pop();
		if (splitted[0][0] == "?")
			options.query = path;
		else {
			options.id = splitted.shift();
			if (splitted.length)
				options.path = "/" + splitted.join("/");
		}
		return options;
	};

	Store.manageRestPath = function(arg, options) {
		if (!arg || arg == '/' || typeof arg === 'object')
			return deep.Arguments([arg, options]);
		return deep.Arguments([deep.utils.parseRestPath(arg, this.route), options]);
	};

	Store.managePathOptions = function(arg, options) {
		if (!options || options == '/')
			return deep.Arguments([arg, {}]);
		if(typeof options.params === 'object')
			return deep.Arguments([arg, options]);
		var str = null;
		if (typeof options !== 'string')
			str = options.path;
		else {
			str = options;
			options = {};
		}
		if (str) {
			var opt = deep.utils.parseRestPath(str, this.route);
			deep.aup(opt, options);
		}
		return deep.Arguments([arg, options]);
	};


	deep.store.fullSheet = {
		_deep_sheet_:true,
		"dq.up::./post":deep.compose.before(function (content, opt) {
			var schema = this.schema;
			if(schema)
			{
				if(this.ownerRestriction)
				{
					if(!deep.Promise.context.session || !deep.Promise.context.session.user)
						return deep.errors.Owner();
					if(!content[this.ownerID])
						content[this.ownerID] = deep.Promise.context.session.user.id;
					else if(content[this.ownerID] !== deep.Promise.context.session.user.id)
						return deep.errors.Owner();
				}
				if(this.applyTransformers)
					this.applyTransformers(content, schema, opt);
				else
					deep.applyTransformers(content, schema);
				var report = null;
				//console.log("store sheet : post : validate : ", this.validate)
				if(this.validate)
					report = this.validate(content, schema, opt);
				else
					report = deep.validate(content, schema);
				if(!report || !report.valid)
					return deep.errors.PreconditionFail("post failed", report);
			}
			return deep.Arguments([content, opt]);
		})
		.around(filterPrivate("post"))
		.before(Store.managePathOptions),

		"dq.up::./put":deep.compose
		.before(putPatchHandler("put", applyPut))
		.around(filterPrivate("put"))
		.before(Store.managePathOptions),

		"dq.up::./patch":deep.compose
		.before(putPatchHandler("patch", applyPatch))
		.around(filterPrivate("patch"))
		.before(Store.managePathOptions),

		"dq.up::./get":deep.compose.around(function(old){
			return function(parsed, options){
				var id = parsed.id || parsed.query, self = this, options = options || {};
				var schema = this.schema;
				//___________________________________ SERVE SCHEMA
				if(id == "schema")
				{
					if(schema && schema.form)
					{
						schema = deep.utils.shallowCopy(schema);
						delete schema.form;
					}	
					return schema || {};
				}
				else if(id == "form")
				{
					if(schema && schema.form)
						return schema.form;
					return [];
				}
				else if(id == "schema+form")
					return schema || {};
				// __________________________________ CONSTRUCT FILTER
				var q = "";
				//console.log("Deep context session : ", deep.Promise.context.session);
				var ownerRestriction = options.ownerRestriction || this.ownerRestriction;
				if (ownerRestriction && ownerRestriction === "full")
					if (deep.Promise.context.session && deep.Promise.context.session.user)
						q += "&" + this.ownerID + "=" + deep.Promise.context.session.user.id;
					else
						return deep.errors.Owner("session doesn't provide info on your role");
				var filter = schema && schema.filter;
				if (filter)
					if(typeof filter === 'function')
						q += filter(id, options);
					else
						q += filter;
				options = options || {};
				options.filter = q;
				// console.log("try get : ", q, ownerRestriction)

				// __________________________________ CALL + filter privates + catch path
				return deep.when(old.call(this, id, options))
				.done(function(res){
					//res = deep.utils.copy(res);
					if(!schema)
					{
						if(parsed.path)
							res = deep.utils.fromPath(res, parsed.path, "/");
						return res;
					}
					if(!id || id[0] == '?' || id[0] == "*")
					{
						if(self._deep_collection_)
						{
							if(!options.noPrivates)
								deep.utils.remove(res, ".//!?_schema.private=true",  { type:"array", items:schema });
							return res;
						}
						if(options.noPrivates)
							return res;
					}
					if(self._deep_object_)
						schema = deep.utils.schemaByValuePath(schema, parsed.id+(parsed.path||""), '/');
					else if(parsed.path)
                    	schema = deep.utils.schemaByValuePath(schema, parsed.path, '/');
					if(schema && !options.noPrivates)
						deep.utils.remove(res, ".//!?_schema.private=true", schema);
					if(parsed.path)
						res = deep.utils.fromPath(res, parsed.path, "/");
					return res;
				});
			};
		}).before(Store.manageRestPath),
		"dq.up::./del":deep.compose.around(function(old){
			return function(parsed, options)
			{
				options = options || {};
				if(parsed.path)
				{
					return deep.when(this.patch(deep.collider.remove(parsed.path), parsed.id))
					.done(function(object){
						return true;
					});
				}
				var id = parsed.id || parsed.query,
					schema = this.schema,
					filter = "";
				if(schema)
					filter = schema.filter || "";
				if(this.ownerRestriction)
				{
					if(!deep.Promise.context.session || !deep.Promise.context.session.user)
						return deep.errors.Owner();
					filter += "&"+this.ownerID+"="+deep.Promise.context.session.user.id;
				}
				options.filter = filter;
				return old.call(this, id, options);
			};
		}).before(Store.manageRestPath),
		"dq.bottom::./!":{
			methods:{
				relation:function(handler, relationName){
					return handler.relation(relationName);
				}
			},
			checkReadOnly:function(object, data, options, schema){
				if(!schema)
					return true;
				if(this._deep_object_)
                    schema = deep.utils.schemaByValuePath(schema, options.id+(options.path||""), '/');
				var nodes = deep.query(data, ".//?_schema.readOnly=true", { fullOutput:true, schema:schema });
				if(!nodes || nodes.length === 0)
					return true;
				var ok = nodes.every(function(e){
					var toCheck = deep.query(object, e.path);
					if(!toCheck)
						return true;
					return deep.utils.deepEqual(toCheck, e.value);
				});
				if(!ok)
					return deep.errors.PreconditionFail("readonly fields.");
				return true;
			},
			first:function(uri, opt){
				opt.filter = opt.filter || "";
				opt.filter += "&limit(1)";
				return deep.when(this.get(uri, opt))
				.done(function(success){
					if(!uri || uri[0] == '?' || uri[0] == "*")
						if(success && succes.forEach)
							return success[0];
					return success;
				});
			},
			relation:function(rel, obj, opt){
				var schema = this.schema;
				if (!schema || !schema.links)
					return deep.errors.Internal("no schema or no links found in store for 'relation' call. ("+rel+")")
				var relation = querier.query(schema.links, "./*?rel=" + rel)[0];
				if(relation)
				{
					var path = utils.interpret(relation.href, obj);
					return protoc.get(utils.parseRequest(path), opt);
				}
				return deep.errors.Store("("+self.name+") no relation found in schema with : "+rel);
			},
			rpc:function(method, args, id, options){
				var self = this;
				options = options || {};
				var handler = this.methods[method];// || this.prototype[method];
				if(!handler)
					return deep.when(deep.errors.MethodNotAllowed("no method found with : "+method+". Aborting rpc call !"));
				
				options.ownerRestriction = this.ownerRestriction?"full":null;

				return deep.when(this.get(id, options))
				.done(function(object){
					//object = deep.utils.copy(object);
					args.unshift({
						call:function (method, args) {
							var handler = self.methods[method];// || self.prototype[method];
							if(!handler)
								return deep.errors.MethodNotAllowed("no method found with : "+method+". Aborting rpc call !");
							return handler.apply(object, args);
						},
						save:function(){
							return self.put(object, id);
						},
						relation:function(relationName)
						{
							var schema = self.schema;
							if(!schema)
								return deep.errors.Store("no schema provided for fetching relation. aborting rpc.getRelation : relation : "+relationName);
							var link = deep.query(schema, "/links/*?rel="+relationName).shift();
							if(!link)
								return deep.errors.Store("("+self.name+") no relation found in schema with : "+relationName);
							var interpreted = deep.utils.interpret(link.href, object);
							return deep.get(interpreted);
						}
					});
					return handler.apply(object, args);
				});
			},
			bulk:function(requests, opt){
				opt = opt || {};
			   /*
				example of bulk requests
					[
					  {to:"2", method:"put", body:{name:"updated 2"}, id: 1},
					  {to:"3", method:"put", body:{name:"updated 3"}, id: 2}
					]

				example of bulk responses
					[
					  {"from":"2", "body":{"name":"updated 2"}, "id": 1},
					  {"from":"3", "body":{"name":"updated 3"}, "id": 2}
					]
				*/
				var self = this,
					alls = [];
				var noError = requests.every(function (req) {
					if(!req.id)
						req.id = "rpc-id"+new Date().valueOf();
					if(!self[req.method])
					{
						alls.push(deep.errors.Store("method not found during buk update : method : "+req.method));
						return false;
					}
					opt.id = req.to;
					if(req.method === 'rpc')
						alls.push(self.rpc(req.body.method, req.body.args, req.to, opt));
					else if(req.method.toLowerCase() === 'get' || req.method.toLowerCase() === 'delete')
						alls.push(self[req.method](req.to, opt));
					else
						alls.push(self[req.method](req.body, opt));
					return true;
				});
				if(!noError)
					return deep.when(alls.pop());
				return deep.all(alls)
				.done(function (results) {
					var res = [];
					var count = 0;
					results.forEach(function (r) {
						var req = requests[count++];
						res.push({
							from:req.to,
							body:r,
							id:req.id
						});
					});
					return res;
				});
			}
		}
	};
	return deep.store.fullSheet;
});