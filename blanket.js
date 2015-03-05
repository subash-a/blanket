window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
window.IDBTransaction = window.webkitIDBTransaction || window.IDBTransaction || window.msIDBTransaction,
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

/**
* Exmaple Object for Initialization   
{
    "dbName":"MyDB",
    "version":1,
    "objectStores": [
	{
	    "name":"MyStore",
	    "objectStoreConfig": {
		"keyPath":"id",
		"autoIncrement":false
	    },
	    "indices":[
		{
		    "indexName":"name",
		    "unique":false
		},
		{
		    "indexName":"title",
		    "unique":true
		}
	    ]
	},
	{
	    "name":"YourStore",
	    "objectStoreConfig":{
		"keyPath":"isbn",
		"autoIncrement":false
	    },
	    "indices":[
		{
		    "indexName":"author",
		    "unique":false
		},
		{
		    "indexName":"title",
		    "unique":true
		}
	    ]
	}
    ]
};

* Example Object for Updatition

{
    "dbName":"MyDB",
    "version":2,
    "objectStores":[
	{
	    "name":"ProductStore",
	    "objectStoreConfig":{
		"keyPath":"productID","autoIncrement":false},
	    "indices":[
		{"indexName":"productName","unique":false},
		{"indexName":"price","unique":true}
	    ]
	}
    ]
}

* Example for Degrading Object
{
    "dbName":"MyDB",
    "version":3,
    "objectStores":[
	{
	    "name":"ProductStore",
	    "objectStoreConfig":{"keyPath":"productID","autoIncrement":false},
	    "indices":[
		{"indexName":"productName","unique":false},
		{"indexName":"price","unique":true}
	    ]
	}
    ]
}

* Example data for MyStore Data
[
    {"id":1,"name":"Subhash","title":"Mr"},
    {"id":2,"name":"Shruthi","title":"Mrs"}
]

* Example data for YourStore
[
    {"isbn":"100","author":"Ernest Hemmingway","title":"Old Man and the Sea"},
    {"isbn":"101","author":"Mark Twain","title":"Tom Sawyer"}
]

*Example data for ProductStore
[
    {"productID":10,"productName":"Bing","price":"Free","company":"MSFT"}
]

**/
var DB = function(initialConfig) {
    var DB;
    var error = function(e) {
	console.log(e);
	console.log("DB Creation Failed");
    },
    success = function(e) {
	DB = this.result;
	console.log("DB Creation Success");
    },
    upgradeneeded = function(e) {
	DB = e.target.result;
	var objStores = initialConfig.objectStores;
	objStores.map(function(o) {
	    oStore = DB.createObjectStore(o.name,o.objectStoreConfig);
	    o.indices.map(function(index){
		oStore.createIndex(index.indexName,index.indexName,{"unique":index.unique});
	    });
	});
	console.log("Object Stores Created");
    };
    var openConnection = function(DBName,DBVersion) {
	var request = window.indexedDB.open(DBName,DBVersion);
	request.onerror = error;
	request.onsuccess = success;
	request.onupgradeneeded = upgradeneeded;
    };
    var mergeObjects = function(oldobject,newobject) {
	var keys = Object.keys(newobject);
	keys.map(function(k){
	    oldobject[k] = newobject[k];
	});
	return oldobject;
    };

    var DBName = initialConfig.dbName;
    var DBVersion = initialConfig.version;

    openConnection(DBName,DBVersion);

    return {
	addData: function(storeName,data) {
	    var store = DB.transaction(storeName,"readwrite").objectStore(storeName);
	    data.map(function(d){
		store.add(d);
	    });
	},
	deleteData: function(storeName,key,success,error) {
	    var store = DB.transaction(storeName,"readwrite").objectStore(storeName);
	    var request = store.delete(key);
	    request.onsuccess = function(event){
		console.log("Deleted object with key: "+key);
		success();
	    };
	    request.onerror = function(event) {
		console.log("Could not delete object with key: " +key);
		error();
	    };
	},
	readData: function(storeNames,keys,success,error) {
	    var transaction = DB.transaction(storeNames);
	    storeNames.map(function(storeName,index){
		var store = transaction.objectStore(storeName);
		var request = store.get(keys[index]);
		request.onsuccess = function(event) {
		    var result = this.result;
		    success(result);
		};
		request.onerror = function(event) {
		    console.log("No data found");
		    error(event);
		};
	    });
	},
	close: function() {
	    DB.close();
	},
	createObjectStore: function(tableConfig) {
	    // Important that the DB connection be closed before the upgrade is performed
	    // else the connection wont return and nothing gets executed.
	    DB.close();
	    var request = window.indexedDB.open(tableConfig.dbName,tableConfig.version);
	    request.onerror = function(e) {
		console.log(e);
		console.log("DB Upgrade Failed");
	    };
	    request.onsuccess = function(e) {
		DB = this.result;
		console.log("DB Upgrade Success");
	    };
	    request.onupgradeneeded = function(e) {
		DB = e.target.result;
		var objStores = tableConfig.objectStores;
		objStores.map(function(o) {
		    oStore = DB.createObjectStore(o.name,o.objectStoreConfig);
		    o.indices.map(function(index){
			oStore.createIndex(index.indexName,index.indexName,{"unique":index.unique});
		    });
		});
		console.log("New Object Stores Created");
	    };
	    return this;
	},
	deleteObjectStore: function(tableConfig) {
	    // Important that the DB connection be closed before the upgrade is performed
	    // else the connection wont return and nothing gets executed.
	    DB.close();
	    var request = window.indexedDB.open(tableConfig.dbName,tableConfig.version);
	    request.onerror = function(e) {
		console.log(e);
		console.log("DB Upgrade Failed");
	    };
	    request.onsuccess = function(e) {
		DB = this.result;
		console.log("DB Upgrade Success");
	    };
	    request.onupgradeneeded = function(e) {
		DB = e.target.result;
		tableConfig.objectStores.map(function(store){
		    DB.deleteObjectStore(store.name);
		});
		console.log("Deleted Object Stores Created");
	    };
	    return this;
	},
	update: function (store, key, object) {
	    var transaction = DB.transaction(store,"readwrite");
	    var oStore = transaction.objectStore(store);
	    var request = oStore.get(key);
	    request.onerror = function(e){
		console.log("error in getting data using key");
	    };
	    request.onsuccess = function(e){
		var obj = request.result;
		obj = mergeObjects(obj,object);
		var updateReq = oStore.put((obj));
		updateReq.onerror = function(e) {
		    console.log("error updating data");
		};
		updateReq.onsuccess = function(e) {
		    console.log("data updated");
		};
	    };
	},
	getCursor: function (store,operation) {
	    var transaction = DB.transaction(store);
	    var oStore = transaction.objectStore(store);
	    var cursorRequest = oStore.openCursor();
	    cursorRequest.onerror = function(e) {
		console.log("unable to create cursor");
	    };
	    cursorRequest.onsuccess = function(e) {
		var cursor = e.target.result;
		if(cursor) {
		    operation(cursor);
		}
		else {
		    console.log("cursor is not available");
		}
	    };
	},
	releaseDB: function() {
	    DB.close();
	    window.indexedDB.deleteDatabase(DBName);
	}		    
    };
}

