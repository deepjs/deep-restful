/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(["require","deepjs/deep", "../lib/object", "deepjs/lib/schema", "deep-restful/lib/chain"], function (require, deep) {

    var unit = {
        title:"deep-restful/tests/object",
        stopOnError:false,
        setup:function(){
            delete deep.Promise.context.session;
        },
        clean:function(){
            delete deep.Promise.context.session;
        },
        tests : {
            get:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"gilles.coomans@gmail.com" } });
                 return deep.restful(store)
                .get("key")
                .equal({ title:"hello",  email:"gilles.coomans@gmail.com" })
            },
            getWithPath:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"gilles.coomans@gmail.com" } });
                return deep.restful(store)
                .get("key/email")
                .equal("gilles.coomans@gmail.com")
            },
            query:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"gilles.coomans@gmail.com" } });
                return deep.restful(store)
                .get("?title=hello")
                .equal([{ title:"hello", email:"gilles.coomans@gmail.com" }])
            },
            post:function(){
                var store = new deep.Object(null, { });
                return deep.restful(store)
                .post({ title:"hello", email:"gilles.coomans@gmail.com" }, "key")
                .equal({ title:"hello", email:"gilles.coomans@gmail.com" })
                .get("key")
                .equal({ title:"hello", email:"gilles.coomans@gmail.com" });
            },
            postErrorIfExists:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"gilles.coomans@gmail.com" } });
                return deep.restful(store)
                .post({ title:"hello", email:"gilles.coomans@gmail.com" }, "key")
                .fail(function(error){
                    if(error && error.status == 409)   // conflict
                        return "lolipop";
                })
                .equal("lolipop");
            },
            postValidationFailed:function(){
                var store = new deep.Object({ 
                    schema:{
                        properties:{
                            key:{
                                properties:{
                                    title:{ type:"string", required:true },
                                    email:{ type:"string", required:true }
                                },
                                additionalProperties:false
                            }
                        }
                    }
                });
                return deep.restful(store)
                .post({ title:"hello", hop:"yop" }, "key")
                .fail(function(error){
                    if(error && error.status == 412)   // Precondition
                        return "lolipop";
                })
                .equal("lolipop");
            },
            postValidationOk:function(){
                var store = new deep.Object(null, {},
                {
                    properties:{
                        key:{
                            properties:{
                                title:{ type:"string", required:true },
                                email:{ type:"string", required:true }
                            },
                            additionalProperties:false
                        }
                    }
                });
                return deep.restful(store)
                .post({ title:"hello", email:"gilles.coomans@gmail.com" }, "key")
                .equal({ title:"hello", email:"gilles.coomans@gmail.com" });
            },
            put:function(){
                var store = new deep.Object(null, { key:{ title:"bloup", email:"gilles.coomans@gmail.com" } });
                return deep.restful(store)
                .put({ title:"hello", email:"gilles@gmail.com" }, "key")
                .equal({ title:"hello", email:"gilles@gmail.com" })
                // .valuesEqual({ title:"hello", email:"gilles@gmail.com" })
                .get("key")
                .equal({ title:"hello", email:"gilles@gmail.com" });
            },
            putWithQuery:function(){
                var store = new deep.Object(null, { key:{ title:"bloup", email:"gilles@gmail.com" } });
                return deep.restful(store)
                .put("hello", "key/title")
                .equal({ title:"hello", email:"gilles@gmail.com" })
                // .valuesEqual({ title:"hello", email:"gilles@gmail.com" })
                .get("key")
                .equal({ title:"hello", email:"gilles@gmail.com" });
            },
            putErrorIfNotExists:function(){
                var store = new deep.Object(null, {  });
                return deep.restful(store)
                .put({ title:"hello", email:"gilles@gmail.com" }, "key")
                .fail(function(error){
                     if(error.status == 404)    // not found
                        return "lolipop";
                })
                .equal("lolipop");
            },
            putValidationFailed:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"testezzzzz" }}, {
                    properties:{
                        key:{
                            properties:{
                                email:{ type:"string", required:true },
                                title:{ type:"string", required:true }
                            },
                            additionalProperties:false
                        }
                    }
                });
                return deep.restful(store)
                .put({ title:"hello", bloup:"test" }, "key")
                .fail(function(error){
                    if(error && error.status == 412)   // Precondition
                        return "lolipop";
                })
                .equal("lolipop");
            },
            putValidationOk:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"testezzzzz" }}, {
                    properties:{
                        key:{
                            properties:{
                                email:{ type:"string", required:true },
                                title:{ type:"string", required:true }
                            },
                            additionalProperties:false
                        }
                    }
                });
                return deep.restful(store)
                .put({ title:"hello", email:"test" }, "key")
                .equal({ title:"hello", email:"test" });
            },
            patch:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"testezzzzz" }});
                return deep.restful(store)
                .patch({ email:"gilles@gmail.com" }, "key")
                .equal({ title:"hello", email:"gilles@gmail.com" })
                // .valuesEqual({ title:"hello", email:"gilles@gmail.com" })
                .get("key")
                .equal({ title:"hello", email:"gilles@gmail.com" });
            },
            patchWithQuery:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"testezzzzz" }});
                return deep.restful(store)
                .patch("gilles@gmail.com", "key/email")
                .equal({ title:"hello", email:"gilles@gmail.com" })
                // .valuesEqual({ title:"hello", email:"gilles@gmail.com" })
                .get("key")
                .equal({ title:"hello", email:"gilles@gmail.com" });
            },
            patchErrorIfNotExists:function(){
                var store = new deep.Object(null, {});
                return deep.restful(store)
                .patch({ email:"gilles@gmail.com" }, "key")
                .fail(function(error){
                    if(error.status == 404) // not found
                        return "lolipop";
                })
                .equal("lolipop");
            },
            del:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"testezzzzz" }});
                return deep.restful(store)
                .del('key')
                .equal(true)
                // .valuesEqual(true)
                .get("key")
                .fail(function(error){
                     if(error && error.status == 404)
                        return "lolipop";
                })
                .equal("lolipop");
            },
            delWithQuery:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"testezzzzz" }});
                return deep.restful(store)
                .del('key/email')
                .equal(true)
                // .valuesEqual(true)
                .get("key")
                .equal({ title:"hello" });
            },
            delFalseIfNotExists:function(){
                var store = new deep.Object(null, { });
                return deep.restful(store)
                .del('key')
                .equal(false);
            },
            range:function(){
                var store = new deep.Object(null, {
                    a:{  count:1 },
                    b:{  count:2 },
                    c:{  count:3 },
                    d:{   count:4 },
                    e:{   count:5 },
                    f:{   count:6 }
                });
                return deep.restful(store)
                .range(2,4)
                .equal({ _deep_range_: true,
                  total: 6,
                  count: 3,
                  results:
                    [
                        { count:3 },
                        { count:4 },
                        { count:5 }
                    ],
                  start: 2,
                  end: 4,
                  hasNext: true,
                  hasPrevious: true,
                  query: '&limit(3,2)'
                })
                /*.valuesEqual([
                    { count:3 },
                    { count:4 },
                    { count:5 }
                ]);*/
            },
            rangeWithQuery:function(){
                var store = new deep.Object(null, {
                    a:{  count:1 },
                    b:{  count:2 },
                    c:{  count:3 },
                    d:{   count:4 },
                    e:{   count:5 },
                    f:{   count:6 }
                });
                return deep.restful(store)
                .range(2,4, '?count=ge=3')
                .equal({ _deep_range_: true,
                  total: 4,
                  count: 2,
                  results:
                    [
                        { count:5 },
                        { count:6 }
                    ],
                  start: 2,
                  end: 3,
                  hasNext: false,
                  hasPrevious: true,
                  query: "?count=ge=3&limit(2,2)"
                })
                /*.valuesEqual([
                    { count:5 },
                    { count:6 }
                ])*/;
            },
            rpc:function(){
                var checker = {};
                var store = new deep.Object(null, { key:{ title:"hello", base:"was there before" } }, null, {
                    methods:{
                        testrpc:function(handler, arg1, arg2)
                        {
                            checker.throughRPC = true;
                            checker.args = [arg1, arg2];
                            checker.base = this.base;
                            this.decorated = "hello rpc";
                            return handler.save();
                        }
                    }
                });
                return deep.restful(store)
                .rpc("testrpc", [1456, "world"], "key")
                .equal({ title:"hello", base:"was there before", decorated:"hello rpc" })
                .get("key")
                .equal({ title:"hello", base:"was there before", decorated:"hello rpc" })
                .nodes(checker)
                .equal({
                    throughRPC:true,
                    args:[1456, "world"],
                    base:"was there before"
                });
            },
            rpcErrorIfNotExists:function(){
                var checker = {};
                var store = new deep.Object(null, { }, null, {
                    methods:{
                        testrpc:function(handler, arg1, arg2)
                        {
                            checker.throughRPC = true;
                            checker.args = [arg1, arg2];
                            checker.base = this.base;
                            this.decorated = "hello rpc";
                            return handler.save();
                        }
                    }
                });
                return deep.restful(store)
                .rpc("testrpc", [1456, "world"], "key")
                .fail(function(error){
                     if(error.status == 404)    // not found
                        return "lolipop";
                })
                .equal("lolipop");
            },
            rpcMethodNotAllowed:function(){
                var checker = {};
                var store = new deep.Object(null, { key:{ title:"hello", base:"was there before" } }, null, {
                    methods:{
                        testrpc:function(handler, arg1, arg2)
                        {
                            checker.throughRPC = true;
                            checker.args = [arg1, arg2];
                            checker.base = this.base;
                            this.decorated = "hello rpc";
                            return handler.save();
                        }
                    }
                });
                return deep.restful(store)
                .rpc("testrpco", [1456, "world"], "key")
                .fail(function(error){
                     if(error.status == 405)    // MethodNotAllowed
                        return "lolipop";
                })
                .equal("lolipop");
            },
            rpcCopy:function(){
                var checker = {};
                var store = new deep.Object(null, { key:{ title:"hello", base:"was there before" } }, null, {
                    methods:{
                        testrpc:function(handler, arg1, arg2)
                        {
                            checker.throughRPC = true;
                            checker.args = [arg1, arg2];
                            checker.base = this.base;
                            this.decorated = "hello rpc";
                            return "lolipop";
                        }
                    }
                });
                return deep.restful(store)
                .rpc("testrpc", [1456, "world"], "key")
                .equal("lolipop")
                .get("key")
                .equal({ title:"hello", base:"was there before" })
                .nodes(checker)
                .equal({
                    throughRPC:true,
                    args:[1456, "world"],
                    base:"was there before"
                });
            },
            getCopy:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"gilles.coomans@gmail.com" } });
                return deep.restful(store)
                .get("key")
                .done(function(s){
                    s.hello = "world";
                })
                .equal({ title:"hello", email:"gilles.coomans@gmail.com", hello:"world" })
                .get("key")
                .equal({ title:"hello", email:"gilles.coomans@gmail.com"});
            },
            queryCopy:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"gilles.coomans@gmail.com" } });
                return deep.restful(store)
                .get("?title=hello")
                .done(function(s){
                    s[0].hello = "world";
                })
                .equal([{ title:"hello", email:"gilles.coomans@gmail.com", hello:"world" }])
                .get("?title=hello")
                .equal([{ title:"hello", email:"gilles.coomans@gmail.com"}]);
            },
            rangeCopy:function(){
                var store = new deep.Object(null, { 
                    a:{ count:1 },
                    b:{ count:2 },
                    c:{ count:3 },
                    d:{ count:4 },
                    e:{ count:5 },
                    f:{ count:6 }
                });
                return deep.restful(store)
                .range(2,4)
                .done(function(range){
                    var res = range.results;
                    res[0].hello = "world";
                    return res;
                })
                .equal(
                    [
                        { count:3, hello:"world" },
                        { count:4 },
                        { count:5 }
                    ]
                )
                .get("c")
                .equal({ count:3 });
            },
            privateGet:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"gilles.coomans@gmail.com" } }, {
                    properties:{ 
                        key:{
                            properties:{
                                title:{ type:"string", "private":true }
                            }
                        }
                    }     
                });
                return deep.restful(store)
                .get("key")
                .equal({ email:"gilles.coomans@gmail.com" })
                //.valuesEqual({ email:"gilles.coomans@gmail.com" });
            },
            /*privateQuery:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"ksss" } }, {
                    properties:{ 
                        key:{
                            properties:{
                                title:{ type:"string", "private":true }
                            }
                        }
                    }
                });
                return deep.restful(store)
                .get("?email=ksss")
                .equal([{ email:"ksss" }]);
            }*/
            privatePost:function(){
                var store = new deep.Object(null, {}, {
                    properties:{ 
                        key:{
                            properties:{
                                title:{ type:"string", "private":true }
                            }
                        }
                    }
                });
                return deep.restful(store)
                .post({ email:"john.doe@gmail.com", title:"test"}, "key")
                .equal({ email:"john.doe@gmail.com" });
            },
            privatePatch:function(){
                var store = new deep.Object(null, { key:{ title:"hello", email:"ksss" } }, {
                    properties:{ 
                        key:{
                            properties:{
                                title:{ type:"string", "private":true }
                            }
                        }
                    }
                });
                return deep.restful(store)
                .patch({ email:"john.doe@gmail.com" }, "key")
                .equal({ email:"john.doe@gmail.com" });
            },
            readOnly:function(){
                var store = new deep.Object(null, { key:{ title:"hello" }}, {
                    properties:{
                        key:{
                            properties:{
                                title:{ readOnly:true, type:"string" }
                            }
                        }
                    }
                });
                return deep.restful(store)
                .patch({ title:"should produce error" }, "key")
                .fail(function(e){
                    if(e && e.status == 412)    // Precondition
                        return "lolipop";
                })
                .equal("lolipop");
            }/*,
            ownerPatchFail:function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", usertitle:"hello" }], {
                    ownerRestriction:"userID"
                });
                return deep.restful(store)
                .patch({ id:"i1", label:"yesssss" })
                .fail(function(e){
                    if(e && e.status == 403)    // forbidden because no session.
                        return "choxy";
                })
                .equal("choxy");
            },
            "ownerPatchOk":function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", usertitle:"hello" }], {
                    ownerRestriction:"userID"
                });
                deep.Promise.context.session = {
                    user:{ title:"hello" }
                };
                return deep.restful(store)
                .patch({ id:"i1", label:"yesssss" })
                .equal({ id:"i1", label:"yesssss", usertitle:"hello"});
            },
            "ownerPutFail":function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", usertitle:"hello" }], {
                    ownerRestriction:"userID"
                });
                deep.Promise.context.session = {
                    user:{ id:"u2" }
                };
                return deep.restful(store)
                .put({ id:"i1", label:"yesssss", usertitle:"hello" })
                .fail(function(e){
                    if(e && e.status == 404)    // not found because restriciton
                        return "ploup";
                })
                .equal("ploup");
            },
            "ownerPutOk":function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", usertitle:"hello" }], {
                    ownerRestriction:"userID"
                });
                deep.Promise.context.session = {
                    user:{ title:"hello" }
                };
                return deep.restful(store)
                .put({ id:"i1", label:"yesssss", usertitle:"hello" })
                .equal({ id:"i1", label:"yesssss", usertitle:"hello"});
            },
            "ownerDelFail":function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", usertitle:"hello" }], {
                    ownerRestriction:"userID"
                });
                deep.Promise.context.session = {
                    user:{ id:"u2" }
                };
                return deep.restful(store)
                .del("i1")
                .equal(false);
            },
            ownerDelOk:function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", usertitle:"hello" }], {
                    ownerRestriction:"userID"
                });
                deep.Promise.context.session = {
                    user:{ title:"hello" }
                };
                return deep.restful(store)
                .del("i1")
                .equal(true);
            },
            filterGet:function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", status:"draft", usertitle:"hello" }], {
                    filter:"&status=published"
                });
                deep.Promise.context.session = {};
                return deep.restful(store)
                .get("i1")
                .fail(function(e){
                    if(e && e.status == 404)
                        return "yolli";
                })
                .equal('yolli');
            },
            filterQuery:function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", status:"draft", usertitle:"hello" }], {
                    filter:"&status=published"
                });
                return deep.restful(store)
                .get("?id=i1")
                .equal([]);
            },
            filterDel:function(){
                var store = deep.rest.Collection.create(null, [{ id:"i1", label:"weee", status:"draft", usertitle:"hello" }], {
                    filter:"&status=published"
                });
                return deep.restful(store)
                .del("i1")
                .equal(false);
            }*/
            , 
            transformers:function(){
                var store = new deep.Object(null, [], {
                    properties:{
                        key:{
                            properties:{
                                label:{ 
                                    type:"string",
                                    transform:[
                                    function(node){
                                        return node.value+":hello"
                                    }]
                                }
                            }
                        }
                    }
                });
                return deep.restful(store)
                .post({ label:"weee", status:"draft", usertitle:"hello" }, "key")
                .done(function(success){
                     return success.label;
                })
                .equal("weee:hello");
            }
        }
    };

    return unit;
});
