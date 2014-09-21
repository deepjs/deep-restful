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


## Other Collection clients

You could use [deep-mongo](https://github.com/deepjs/deep-mongo) or [deep-local-storage](https://github.com/deepjs/deep-local-storage) (among other) to have persistent collection.

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


deep.Collection({ 
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

deep.restful("myProtocol")
post({
	password:"test1234", // password will be hashed
	email:"john@doe.com"
})
.slog() // you see the posted result : without password
.done(function(obj){
	obj.email = "johny#begood.com";
})
.patch()
.log(); // you'll see an error 412 PreconditionFail : email is readonly
```


## Licence

LGPL 3.0
