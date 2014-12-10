window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
window.IDBTransaction = window.webkitIDBTransaction || window.IDBTransaction || window.msIDBTransaction,
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var initObject = {
    "dbName":"MyDB",
    "version":1,
    "objectStores":[
	{
	    "name":"MyStore",
	    "objectStoreConfig":{"keyPath":"id","autoIncrement":false},
	    "indices":[
		{"indexName":"name","unique":false},
		{"indexName":"title","unique":true}
	    ]
	},
	{  "name":"YourStore",
	    "objectStoreConfig":{"keyPath":"isbn","autoIncrement":false},
	    "indices":[
		{"indexName":"author","unique":false},
		{"indexName":"title","unique":true}
	    ]
	}
    ]
};

var upgradeObject = {
    "dbName":"MyDB",
    "version":2,
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
};


var degradeObject = {
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
};
var sampleData_MyStore = [
    {"id":1,"name":"Subhash","title":"Mr"},
    {"id":2,"name":"Shruthi","title":"Mrs"}
];

var sampleData_YourStore = [
    {"isbn":"100","author":"Ernest Hemmingway","title":"Old Man and the Sea"},
    {"isbn":"101","author":"Mark Twain","title":"Tom Sawyer"}
];

var sampleData_ProductStore = [
    {"productID":10,"productName":"Bing","price":"Free","company":"MSFT"}
];

var createDB = function(initObj) {
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
	var objStores = initObj.objectStores;
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
    var DBName = initObject.dbName;
    var DBVersion = initObject.version;
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
	releaseDB: function() {
	    DB.close();
	    window.indexedDB.deleteDatabase(DBName);
	}
		    
    };
}

