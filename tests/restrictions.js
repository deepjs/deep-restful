/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}

define(["require","deepjs/deep", "../lib/collection"], function (require, deep) {
	
	//_______________________________________________________________ GENERIC STORE TEST CASES


	var unit = {
		title:"deep-restful/tests/restrictions",
		stopOnError:false,
		tests : {
			restriction_up:function(){
				var a = {
					get:function(){
						return "hello";
					}
				};
				deep.aup(deep.Disallow('get'), a);
				return deep(a.get())
				.fail(function(e){
					if(e.status === 403)
						return "lolipop";
				})
				.equal("lolipop");
			},
			restriction_up_collection:function(){
				var a = deep.aup(deep.Disallow('get'), deep.Collection());
				return deep(a.get())
				.fail(function(e){
					if(e.status === 403)
						return "lolipop";
				})
				.equal("lolipop");
			},
			restriction__backgrounds:function(){
				var a = {
					_backgrounds:[{
						get:function(){
							return "hello";
						}
					}, deep.Disallow('get')]
				};
				return deep.flatten(a)
				.done(function(a){
					return a.get();
				})
				.fail(function(e){
					if(e.status === 403)
						return "lolipop";
				})
				.equal("lolipop");
			},
			restriction_backgrounds_collections:function(){
				var a = {
					_backgrounds:[deep.Collection(), deep.Disallow('get')]
				};
				return deep.flatten(a)
				.done(function(a){
					return a.get();
				})
				.fail(function(e){
					if(e.status === 403)
						return "lolipop";
				})
				.equal("lolipop");
			},
			restriction_ocm_collections:function(){
				var a = deep.ocm({
					role1:deep.Collection(),
					role2:{
						_backgrounds:["this::../role1", deep.Disallow('get')]
					}
				});
				return deep.flatten(a)
				.done(function(a){
					return a("role2").get();
				})
				.fail(function(e){
					if(e.status === 403)
						return "lolipop";
				})
				.equal("lolipop");
			},
			allow_only_up:function(){
				var obj = {
					a:true,
					b:"hello",
					c:function(){
						return "hello";
					}
				}
				obj = deep.aup(deep.AllowOnly("b"), obj);
				var a,b,c;
				try{
					a = obj.a;
					b = obj.b;
					c = obj.c().status;
				}
				catch(e)
				{

				}
				var r = [a, b, c];
				return deep(r)
				.equal([true, "hello", 403])
			},
			allow_only__backgrounds:function(){
				var obj = {
					a:true,
					b:"hello",
					c:function(){
						return "hello";
					}
				}
				var obj2 = {
					_backgrounds:[obj, deep.AllowOnly("b")]
				}
				deep.flatten(obj2);
				var a,b,c;
				try{
					a = obj2.a;
					b = obj2.b;
					c = obj2.c().status;
				}
				catch(e)
				{

				}
				var r = [a, b, c];
				return deep(r)
				.equal([true, "hello", 403])
			},
			allow_only_backgrounds2:function(){
				var obj = {
					_backgrounds:[deep.AllowOnly("b")],
					a:true,
					b:"hello",
					c:function(){
						return "world";
					}
				}
		
				deep.flatten(obj);
				var a,b,c, d;
				try{
					a = obj.a;
					b = obj.b;
					c = obj.c();
				}
				catch(e)
				{

				}
				var r = [a, b, c];
				return deep(r)
				.equal([true, "hello", "world"])
			}
		}
	};

	return unit;
});

