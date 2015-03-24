/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require", "deepjs/lib/deep-chain"], function(require, NodesChain){


	var api = {
			//__________________________________________________________ MAP
		/**
		 * It's the way of performing a SQL JOIN like between two collections without JSON-Schema links.
		 * "Collections" could be retrievables.
		 *
		 * 
		 * Action : 
		 * Seek after localKeys in current chain's entries, 
		 * use it to get 'what' with foreignKey=localKey, and finnaly store result at 'whereToStore' path in                   current entries values.
		 *
		 * @example 
		 * deep.nodes(myCollec)
		 * .mapOn(otherCollec, keyFromMyCollec, keyFromOtherCollec, whereToStoreJoinedValueInMyCollecItem)
		 * 
		 * @example

	deep.nodes([{ title:"my title", id:1}, { title:"my title 2", id:2}])
	.mapOn([
			{id:1, itemId:1, value:true},
			{id:2, itemId:2, value:"133"},
			{id:3, itemId:2, value:"hello"}
		],
		"id","itemId","linkeds")
	.equal([
		{
			title:"my title",
			id:1,
			linkeds:{ itemId:1, value:true }
		},
		{
			title:"my title 2",
			id:2,
			linkeds:[
				{ itemId:2, value:"133" },
				{ itemId:2, value:"hello"}
			]
		}
	]);
		 *
		 * @method mapOn
		 * @chainable
		 * @param  {Collection|retrievable_string} what
		 * @param  {string} localKey  the name of the localKey to match with Collection items
		 * @param  {string} foreignKey  the name of the foreignKey to match with current entries
		 * @param  {string} whereToStore (optional : default is localKey) the path where save map result in each entries
		 * @return {NodesChain} this
		 */
		mapOn: function(what, localKey, foreignKey, whereToStore) {
			var self = this;
			var doMap = function(s, what, localKey, foreignKey, whereToStore) {
				var map = {};
				what.forEach(function(w) {
					//console.log("mapOn : w :", w)
					if (w === null)
						return;
					var val = w[foreignKey];
					if (typeof map[val] !== 'undefined') {
						if (map[val].forEach)
							map[val].push(w);
						else
							map[val] = [map[val], w];
					} else
						map[val] = w;
				});
				var finaliseNode = function(entry) {
					if (map[entry.value[localKey]])
						entry.value[whereToStore || localKey] = map[entry.value[localKey]];
					if(entry.ancestor)
						entry.ancestor.value[entry.key] = entry.value;
				};
				if(s._deep_array_)
					s.forEach(finaliseNode);
				else if(s.forEach)
					s.forEach(function(entry){
						if (map[entry[localKey]])
							entry[whereToStore || localKey] = map[entry[localKey]];
					});
				else if(s._deep_query_node_)
					finaliseNode(s);
				else if (map[s[localKey]])
					s[whereToStore || localKey] = map[s[localKey]];
				return s;
			};
			var func = function(s) {
				if (!s)
					return s;
				if (typeof what === 'string') {
					var parsed = utils.parseRequest(what);
					//cloned.logValues();
					//console.log("____________________________ mapon :  query : ","./" + localKey);
					var foreigns;
					if(s._deep_array_)
						foreigns = querier.query(s, "./*/value/" + localKey).join(",");
					else if(s.forEach)
						foreigns = querier.query(s, "./*/" + localKey).join(",");
					else
						foreigns = querier.query(s, "./" + localKey);
					//console.log("_____________ foreigns : ", foreigns);
					var constrain = foreignKey + "=in=(" + foreigns + ")";
					if (parsed.uri === '!')
						parsed.uri = "";
					if (parsed.uri.match(/(\/\?)|^(\?)/gi))
						parsed.uri += "&" + constrain;
					else
						parsed.uri += "?" + constrain;
					//console.log("mapOn : parsedUri with constrains : ",parsed.uri);
					if (parsed.store !== null)
						return protoc.get(parsed)
							.done(function(results) {
								results = [].concat(results);
								return doMap(s, results, localKey, foreignKey, whereToStore);
							});
					else
						return errors.Internal("deep.mapOn need array as 'what' : provided : " + JSON.stringify(what));
				} else
					return doMap(s, what, localKey, foreignKey, whereToStore);
			};
			func._isDone_ = true;
			return self._enqueue(func);
		},

		/**
		 * retrieve relations described in schema links.
		 *
		 * Inject as success in chain an object that hold each relation, their result and the associated (parsed) request object
		 *
		 *
		 *
		 *
		 * @method getRelations
		 * @chainable
		 * @example
		 * var schema3 = {
				properties:{
					id:{ type:"string", required:false, indexed:true },
					label:{ type:"string" },
					plantId:{ type:"string" },
					userId:{ type:"string" }
				},
				links:[
					{
						href:"plant::{ plantId }",
						rel:"plant"
					},
					{
						href:"user::{ userId }",
						rel:"user"
					}
				]
			}
			//____________________________
			deep.nodes({
				plantId:"e1",
				userId:"e1",
				label:"hello"
			}, schema3)
			.getRelations("plant", "user")
			.log();

		 * @param a list of string arguments that gives which relation to retrieve
		 * @return {NodesChain} this
		 */
		getRelations: function() {
			var self = this;
			var relations = utils.argToArr.call(arguments);
			var func = function(s, e) {
				if(!s)
					return s;
				var alls = [];
				var doGet = function(entry) {
					if (!entry.schema || !entry.schema.links)
						return;
					var r = {
						value: entry.value,
						schema: entry.schema
					};
					querier.query(entry.schema.links, "./*?rel=in=(" + relations.join(",") + ")")
						.forEach(function(relation) {
							//console.log("getRelations : got : ", relation)
							var path = utils.interpret(relation.href, entry.value);
							var parsed = utils.parseRequest(path);
							var wrap = {
								rel: relation,
								href: parsed
							};
							r[relation] = wrap;
							alls.push(protoc.get(parsed, {
								wrap: wrap
							}));
						});
				}
				if(s._deep_array_)
					s.forEach(doGet);
				else if(s._deep_query_node_)
					doGet(s);
				if (alls.length)
					return prom.all(alls);
				return null;
			};
			func._isDone_ = true;
			return self._enqueue(func);
		},

		/**
		 * map relations in current entries values
		 *
		 * @method mapRelations
		 * @chainable
		 * @param  {Object} map        the map (see examples)
		 * @param  {String} delimitter (optional) the paths delimitter
		 * @return {NodesChain}       this
		 *
		 * @example
		 * var schema3 = {
				properties:{
					id:{ type:"string", required:false, indexed:true },
					label:{ type:"string" },
					plantId:{ type:"string" },
					userId:{ type:"string" }
				},
				links:[
					{
						href:"plant::{ plantId }",
						rel:"plant"
					},
					{
						href:"user::{ userId }",
						rel:"user"
					}
				]
			};
			deep.nodes({
				plantId:"e1",
				userId:"e1",
				label:"hello"
				}, schema3)
			.mapRelations({
				user:"relations.user",
				plant:"relations.plant"
			})
			.logValues();
		 */
		mapRelations: function(map, delimitter) {
			if (!delimitter)
				delimitter = ".";
			var self = this;
			var relations = [];
			for (var i in map)
				relations.push(i);
			//console.log("mapRelations :  relations : ", relations);
			var func = function(s, e) {
				if(!s || (!s._deep_query_node_ && !s._deep_array_))
					return s;
				var doMap = function(entry) {
					if (!entry.schema || !entry.schema.links)
						return;
					var alls = [];
					querier.query(entry.schema.links, "./*?rel=in=(" + relations.join(",") + ")")
						.forEach(function(relation) {
							//console.log("do map relations on : ", relation);
							var path = utils.interpret(relation.href, entry.value);
							alls.push(protoc.get(path, {
								defaultProtocole: "json",
								wrap: {
									path: map[relation.rel]
								}
							}));
						});
					var d = prom.all(alls)
						.done(function(results) {
							//console.log("mapRelations : results : ");
							//console.log(JSON.stringify(results));
							results.forEach(function(r) {
								//console.log("do : ", r, " - on : ", entry.value)
								utils.toPath(entry.value, r.path, r.result, delimitter);
							});
							return results;
						});
					promises.push(d);
				};
				var promises = [];
				if(s._deep_array_)
					s.forEach(doMap);
				else
					doMap(s);
				if (!promises.length)
					return s;
				return prom.all(promises)
					.done(function() {
						return s;
					});
			};
			func._isDone_ = true;
			return self._enqueue(func);
		}
	};


	NodesChain._up(api);
	return NodesChain;
});