# deep-restful

Homogeneous Restful collection manipulation for deepjs.

This library comes with :
* a memory Collection manager that define exactly the same API than any other deepjs client. 
* a memory Object manager that define the same API
* a HTTP/Restful client that define the same API and used as base class for other deepjs http clients (jquery ajax, nodejs http, etc.).
* other stores related sheets (transformations applied on stores that gives homogeneity)
* a chained, Promise based, restful handler that use this API and allow dependency injection.


The API defines :
* get("id" || "?myQuery=true" || "")
* range(start, end, query)
* post( obj || null )
* put( obj || null )
* patch( obj || null )
* del( obj || null )
* rpc( method, args, id)
* bulk( actions )

And defines additionnaly for collections (not for deep.Object)
* flush()
* count()

It could be combined with protocols and OCM. (see deepjs core docs for more infos).


## install

```
npm install deep-restful
```

or 

```
bower install deep-restful
```
It will install also deepjs if not already there.


## Simple usage

```javascript
var deep = require("deepjs/deep"); // load core
require("deep-restful/index");  // load chain
require("deep-restful/lib/collection"); // load collection manager

deep.Collection("myProtocol", [{ id:"e1", title:"hello world"}]);

deep.restful("myProtocol")
.get("e1")
.done(function(obj){
	// do something with obj
	obj.title = "hello deep-restful";
})
.put()
.log(); // you'll se the putted object
```


## JSON-Schema  validation : 

You could associate a schema to a collection :

```javascript
var deep = require("deepjs/deep"); // load core
require("deep-restful/index");  // load chain
require("deep-restful/lib/collection"); // load collection manager

deep.Collection({ 
	protocol:"myProtocol", 
	collection:[{ id:"e1", title:"hello world"}],
	schema:{
		properties:{
			title:{ type:"string", required:true, minlength:6 }
		}
	}
);

deep.restful("myProtocol")
.get("e1")
.done(function(obj){
	// do something with obj
	obj.title = "hello";
})
.put()
.log(); // you'll see an error 412 PreconditionFail with a report describing the validation error.
```

## Constraints

Within the JSON-Schema, you could define constraints on any properties :
* private : property is removed on "get" (query and range also)
* readOnly : property could not be modified

There is a more obstrusive constraint that allow to securise collection access by item's owner.
(it work with session defined in deep.context : see [autobahnjs](https://github.com/deepjs/autobahn))
* ownRestriction : could be a string, giving the name of the property in item that give owner (as "userId"), or false.

And finally, collection managers could apply transformation automatically on post/put/patch, wich is usefull for hashing a password on update by example.


```javascript
var deep = require("deepjs/deep"); // load core
require("deep-restful/index");  // load chain
require("deep-restful/lib/collection"); // load collection manager


var myCollection = deep.Collection({ 
	protocol:"myProtocol", 
	collection:[{ id:"e1", title:"hello world"}],
	schema:{
		properties:{
			password:{
				type:"string", 
				required:true, 
				minlength:6,
				"private":true
				transformers:[function(input){ return deep.utils.Hash(input); }] 
			},
			email:{ type:"string", format:"email", readOnly:true }
		}
	}
);

deep.restful(myCollection)
post({
	password:"test1234", // password will be hashed
	email:"john@doe.com"
})
.slog() // you see the posted result : without password
.done(function(obj){
	obj.email = "johnny#begood.com";
})
.patch()
.log(); // you'll see an error 412 PreconditionFail : email is readonly
```

## JSON-RPC

You could include RPC methods in you store definition.

```javascript
var deep = require("deepjs/deep"); // load core
require("deep-restful/index");  // load chain
require("deep-restful/lib/collection"); // load collection manager


deep.Collection({ 
	protocol:"myProtocol", 
	collection:[{ id:"e1", title:"hello world"}],
	methods:{
		addDescription:function(handler, description){
			// 'this" refer to object retrieved with id provided to rpc call
			this.description = description;
			this.lastUpdate = +new Date;
			return handler.save();
		}
	}
);

deep.restful("myProtocol")
rpc("addDescription", ["object's description"], "e1")
.slog() // you see the rpc result
.get() // get all on current store
.log(); // you see an array : [{ id:"e1", title:"hello world", "object's description"}]
```

## Other Collection clients

### Persistent Collection
You could use [deep-mongo](https://github.com/deepjs/deep-mongo) or [deep-local-storage](https://github.com/deepjs/deep-local-storage) (among other) to have persistent collection that implement same API than above.

example with [deep-mongo](https://github.com/deepjs/deep-mongo) : 

```javascript
var deep = require("deepjs"); // load core
require("deep-restful");  // load chain
require("deep-mongo"); // load driver

deep.Mongo({ 
	protocol:"myProtocol", 
	collectionName:"myCollection",
	url:"mongodb://127.0.0.1:27017/test",
	schema:{
		properties:{
			title:{ type:"string", required:true, minLength:6 }
		}
	},
	methods:{
		//...
	}
);

deep.restful("myProtocol")
.get("e1")
.done(function(obj){
	// do something with obj
	obj.title = "hello mongodb";
})
.put()
.log(); // you'll see the putted object
```


### HTTP/Restful client

When you want to interact with remote restful services (from browser or nodejs to remote server),
you could use http clients such as 'deep-jquery/ajax/xxx' or 'deep-node/rest/http/xxx' where xxx=json|html|xml
that implement same API than above but act remotely.

```javascript
var deep = require("deepjs"); // load core
require("deep-restful");  // load restful chain
require("deep-jquery/ajax/json"); // load json restful client

// define a json client to your remote json service
deep.jquery.ajax.json({ 
	protocol:"myService", 
	baseURI:"/my/service/base/uri"
});

deep.restful("myService")
.get("....") // get something from remote service. e.g. from : /my/service/base/uri/....
.done(function(obj){
	// do something with obj
})
.put()
.log(); // you'll see the put result on remote service or any error from chain.
```

When you use your service through deep.restful chain and protocols, you don't even need to know if you're working remotely or not.
Code still the same.

It acts as a <strong>dependecy injection</strong> mecanism and allows great modularity and isomorphism.

You could develop then all your services and clients logics blindly browser side ___or___ server side (or from deep-shell), with dummies collections or not, and then choose to run it remotely or not, with different stores implementations depending on production flags by example.


#### Remote and local validation

When you want to pre-validate datas before to send them to remote services (by example on form submition from browser), you could specify in your remote client definition where to get schema before sending datas to remote (or you could provide directly your own schema).


```javascript
var deep = require("deepjs"); // load core
require("deep-restful");  // load restful chain
require("deep-jquery/ajax/json"); // load json restful client

// define generic json client
deep.jquery.ajax.json("json");

// define a json client to your remote json service
deep.jquery.ajax.json({ 
	protocol:"myService", 
	baseURI:"/my/service/base/uri",
	schema:"json::/my/service/base/uri/schema"
});

deep.restful("myService")
.get("....") // get something from remote service. e.g. from : /my/service/base/uri/....
.done(function(obj){
	// do something with obj
})
.put() // will pre-validate with local schema before send
.log(); // you'll see the put result on remote service or any error from chain (maybe a precondition fail from local validation).
```

___Remarque___ : If the remote service is defined with a deep-restful compliant store (with [autobahnjs](https://github.com/deepjs/autobahn) by example), and if it has a schema defined, you could retrieve it by passing "schema" as id.
e.g. `deep.get("myService::schema").log();` or `deep.restful("myService").get("schema").log();`.



## Nodejs simple example

```javascript

var http = require('http');
var deep = require('deepjs'); // the core
require('deep-restful'); // homogeneous restful API
require('deep-restful/lib/collection'); // simple memory collection

deep.Collection("myobjects", []);

var titles = ["hello", "deepjs", "world"];
var count = 0;

http.createServer(function (req, response) {
	deep
	.restful("myobjects")
	.post({ title:titles[++count%3], count:count })
	.get(String(req.url).substring(1))
	.done(function(res){
		response.writeHead(200, {'Content-Type': 'application/json'});
		response.end(JSON.stringify(res));
	})
	.fail(function(error){
		console.log("error : ", error.toString());
		response.writeHead(error.status || 500, {'Content-Type': 'application/json'});
		response.end(JSON.stringify(error));
	});
})
.listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');

```
Then, open your browser, go to http://127.0.0.1:1337/, refresh few times, and try :

http://127.0.0.1:1337/_an_id_of_an_item_in_collection_
or
http://127.0.0.1:1337/?title=deepjs
or
http://127.0.0.1:1337/?count=lt=2



## Licence

LGPL 3.0
