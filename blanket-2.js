var IDB = function(configuration) {
    var _DB_INSTANCE;
    var _DB_VERSION;
    var _DB_NAME;

    var _openDB = function(dbName, dbVersion, error, upgrade, success) {
	var request;
	if(dbVersion) {
	    request = window.indexedDB.open(dbName, dbVersion);
	}
	else {
	    request = window.indexedDB.open(dbName);
	}
	request.onerror = function(event) {
	    if(error) {
		error(event.target.error);
	    }
	};
	
	request.onsuccess = function(event) {
	    _DB_INSTANCE = event.target.result;
	    if(success) {
		success(_DB_INSTANCE);
	    }
	};
	
	request.onupgradeneeded = function(event) {
	    _DB_INSTANCE = event.target.result;
	    if(upgrade) {
		upgrade(_DB_INSTANCE);
	    }
	};
    };

    var _incrementDBVersion = function() {
	_DB_VERSION = _DB_VERSION + 1;
    };
    
    var _dbOperations = {
	'close': function() {
	    var promise = new Promise(function(resolve, reject){
		var success = function(DBInst){
		    DBInst.close();
		    resolve(_dbOperations);
		};
		var upgrade = function(DBInst) {
		    DBInst.close();
		    resolve(_dbOperations);
		};
		var error = function(error) {
		    reject(error);
		};
		_openDB(_DB_NAME, _DB_VERSION, error, upgrade, success);
	    });
	    return promise;
	},
	'addDataToStore': function(storeName, data) {
	    var promise = new Promise(function(resolve, reject) {
		var upgrade = function(DBInst) {
		    reject(new Error("DB not in upgrade mode"));
		};
		var success = function(DBInst) {
		    var dbTransaction = DBInst.transaction(storeName, "readwrite");
		    var dataStore = dbTransaction.objectStore(storeName);
		    if(data && data.length) {
			data.forEach(function(item){
			    dataStore.add(item);
			});
		    }
		    dataStore.transaction.oncomplete = function(event) {
			resolve(_dbOperations);
		    }
		    dataStore.transaction.onerror = function(event) {
			reject(new Error("Data addition failed"));
		    }
		};
		var error = function(error) {
		    reject(error);
		};
		_openDB(_DB_NAME, _DB_VERSION, error, upgrade, success);
	    });
	    return promise;
	},
	'createStore': function(storeConfig) {
	    // Increment DB Version before opening for upgrade
	    _incrementDBVersion(); 
	    var promise = new Promise(function(resolve, reject) {
		var upgrade = function(DBInst) {

		    var storeName = storeConfig.storeName || "DefaultStore";
		    var storeKeyPath = {'keyPath': storeConfig.keyPath} || {autoIncrement: true};
		    if(!DBInst.objectStoreNames.contains(storeName)) {
			var objectStore = DBInst.createObjectStore(storeName, storeKeyPath);
		    }
		    resolve(_dbOperations);
		};
		var success = function(DBInst) {
		    reject(new Error("DB not in upgrade mode"));
		};
		var error = function(error) {
		    reject(error);
		};
		_openDB(_DB_NAME, _DB_VERSION, error, upgrade, success);
	    });
	    return promise;
	},
	'createIndexes': function(storeName, indexArray) {
	    var promise = new Promise(function(resolve, reject) {
		var upgrade = function(DBInst){
		    var transaction = DBInst.transaction(storeName, "readwrite");
		    var store = transaction.objectStore(storeName);
		    if(indexArray && indexArray.length) {
			indexArray.forEach(function(index){
			    store.createIndex(index);
			});
		    }
		    store.transaction.oncomplete = function(e) {
			resolve(_dbOperations);
		    };
		    store.transaction.onerror = function(e) {
			reject(e);
		    }
		};
		var success = function(DBInst){
		    reject(new Error("DB is not in upgrade mode"));
		};
		var error = function(error) {
		    reject(error);
		};
	    });
	    return promise;
	},
	'deleteDB': function() {
	    window.indexedDB.deleteDatabase(_DB_NAME);
	}
    };

    _DB_NAME = configuration.dbName || "DefaultDB";
    _DB_VERSION = undefined;
    
    var promise = new Promise(function(resolve, reject) {
	var error = function(error) {
	    reject(error);
	};

	var success = function(DBInst) {
	    _DB_VERSION = DBInst.version;
	    resolve(_dbOperations);
	};

	var upgrade = function(DBInst) {
	    _DB_VERSION = DBInst.version;
	    resolve(_dbOperations);
	};
	_openDB(_DB_NAME, _DB_VERSION, error, upgrade, success);
    });

    return promise;
    
};
