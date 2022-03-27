const DOWNLOAD_CNAMES = 1;
const FRAGMENT_LENGTH = 20;

const database = require("../database");

let fileCache = [];

let currentKey = 0


// For uploading

async function startUpload(filename) {
    var targetData = fileCache.find(fileData => fileData.name == filename);
    var databaseData = await database.getHash(filename)
    if (!targetData && !databaseData.data) {
        currentKey += 1
        fileCache.push({
            name: filename,
            key: currentKey,
            currentSequence: 0,
            Hash: "",
            finished: false
        })
        return currentKey.toString()
    } else {
        return "EXIST"
    }
}

function endUpload(key) {
    
    var targetData = fileCache.find(fileData => (fileData.key || "").toString() == key);
    if (targetData) {
        targetData.finished = true
        targetData.key = null
        database.addHash(targetData.name,targetData.Hash)
        return "OK"
    } else {
        console.log("Unknown key");
        return "ERROR"
    }
}

function fragmentUpload(key,seq,data) {
    var targetData = fileCache.find(fileData => (fileData.key || "").toString() == key);
    if (targetData) {
        if (targetData.currentSequence == Number(seq)) {
            targetData.currentSequence += 1;
            targetData.Hash = targetData.Hash + data;
            return "OK"
        } else {
            console.log("Invalid sequence");
            return "ERROR"
        }
        
    } else {
        console.log("Unknown key for fragment",key);
        return "ERROR"
    }
}

// For downloading

async function infoDownload(name) {
    
    var targetData = fileCache.find(fileData => fileData.name == name);
    if (!targetData) {
        var dbData = await database.getHash(name) 
        if (dbData.success) {
            targetData = dbData.data
            fileCache.push({
                name: targetData.Name,
                key: null,
                currentSequence: 0,
                Hash: targetData.Hash,
                finished: true
            })
        }
        console.log(targetData);
    }
    if (targetData) {
        let fragmentCount = Math.ceil((targetData.Hash.length/FRAGMENT_LENGTH)/DOWNLOAD_CNAMES)
        return fragmentCount.toString()
    } else {
        console.log("Unknown name");
        return "DNE"
    }
}

function getDownload(name,segNum,callback) {
    
    var targetData = fileCache.find(fileData => fileData.name == name);
    if (targetData) {
        var fragGroupStart = (segNum*(FRAGMENT_LENGTH*DOWNLOAD_CNAMES))
        let fragGroup = targetData.Hash.substring(fragGroupStart,fragGroupStart+(FRAGMENT_LENGTH*DOWNLOAD_CNAMES))
        let fragmentCount = Math.ceil((targetData.Hash.length/FRAGMENT_LENGTH))

        //console.log("frags",fragmentCount)
        for (i=0; i < DOWNLOAD_CNAMES; i++) {
            var stringStart = (i*FRAGMENT_LENGTH)
            let fragment = fragGroup.substring(stringStart,stringStart+FRAGMENT_LENGTH)
            //console.log("adding frag:",fragment)
            callback(fragment)
        }
    } else {
        console.log("Unknown name");
        callback("DNE")
    }
}

module.exports = async function(arguments,addResponse) {
    let direction = arguments[0]

    if (direction == "up") {
        let command = arguments[1]
        
        if (command == "start") {
            let filename = arguments[2]
            addResponse(await startUpload(filename))
        } else if (command == "send") {
            let key = arguments[2]
            let seqNum = arguments[3]
            let data = arguments[4]
            
            addResponse(fragmentUpload(key,seqNum,data))

        } else if (command == "end") {
            let key = arguments[2]
            addResponse(endUpload(key))
        } else {
            console.log("Invalid up command: ",command)
        }
        
    } else if (direction == "dn") {
        //dn.info.applicationName.dns-exfil.tech - General; size
        //dn.get.seqNumber.applicationName.dns-exfil.tech - sequence of an application

        let command = arguments[1]
        if (command == "info") {
            let name = arguments[2]
            addResponse(await infoDownload(name))

        } else if (command == "get") {
            let seqNum = arguments[3]
            let name = arguments[2]
            getDownload(name,seqNum,addResponse)
        }

    }
}