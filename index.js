/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * Homogeneous Restful collection manipulation for deepjs.
 *
 * TODO : use directives-lexer for transformers : allow full json schema.
 * 
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require", "deepjs/deep", "./lib/chain"], function(require, deep, collection, chain){
	deep.coreUnits = deep.coreUnits || [];
	deep.coreUnits.push("req::deep-restful/tests/restrictions");
	return deep;
});