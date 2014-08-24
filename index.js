/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * Homogeneous Restful collection manipulation for deepjs.
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require", "deepjs/deep", "./lib/chain"], function(require, deep, collection, chain){
	deep.coreUnits = deep.coreUnits || [];
	deep.coreUnits.push("js::deep-restful/tests/collections","js::deep-restful/tests/object","js::deep-restful/tests/restrictions");
	return deep;
});