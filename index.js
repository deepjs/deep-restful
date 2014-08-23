/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * Homogeneous Restful collection manipulation for deepjs.
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require", "deepjs/deep", "./lib/collection", "./lib/chain"], function(require, deep, collection, chain){
	return deep;
});