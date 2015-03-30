var sampleData_MyStore = [
    {"id":1,"name":"Subhash","title":"Mr"},
    {"id":2,"name":"Shruthi","title":"Mrs"}
];

var initObject = {
    "dbName":"MoldelogiqDB",
    "dbVersion":6
};

var dbOps;
var createStore = function(DbInst){
    return DbInst.createStore({storeName:'knowledge',keyPath:'uid'})
};
var closeDB = function(DbInst){
    return DbInst.close();
};
var addDataToStore = function(DbInst) {
    DbInst.addDataToStore('knowledge', [{'uid':'asta','name':'blue'},{'uid':'ta','name':'red'},{'uid':'ast','name':'green'}])
	.then(function(DbInst){ console.log ('Success') })
	.catch(function(e){ console.error(e.message) });
}

var createIndices = function(DbInst) {
    return DbInst.createIndexes('knowledge', ['name'])
	.then(function(e){ console.log("created index") })
	.catch(function(e){ console.log(e) });
}

var xdb = new IDB(initObject)
    .then(closeDB)
    .then(createStore)
    .then(createIndices)
    .catch(function(e){
	console.error(e.message);
    });


    
