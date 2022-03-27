// Author: Harrison Lewis (@Stratiz)

const dns2 = require('dns2');

const { Packet } = dns2;

let fileCache = [];

let currentKey = 0

// For uploading

function startUpload(filename) {
    currentKey += 1
    fileCache.push({
        name: filename,
        key: currentKey,
        currentSequence: 0,
        base64: "",
        finished: false
    })
    return currentKey.toString()
}

function endUpload(key) {
    
    var targetData = fileCache.find(fileData => fileData.key.toString() == key);
    if (targetData) {
        targetData.finished = true
        targetData.key = null
        return "OK"
    } else {
        console.log("Unknown key");
        return "ERROR"
    }
}

function fragmentUpload(key,seq,data) {
    var targetData = fileCache.find(fileData => fileData.key.toString() == key);
    if (targetData) {
        if (targetData.currentSequence == Number(seq)) {
            targetData.currentSequence += 1;
            targetData.base64 = targetData.base64 + data;
            return "OK"
        } else {
            console.log("Invalid sequence");
            return "ERROR"
        }
        
    } else {
        console.log("Unknown key for fragment");
        return "ERROR"
    }
}

// For downloading

function infoDownload(name) {
    
    var targetData = fileCache.find(fileData => fileData.name == name);
    if (targetData) {
        let fragmentCount = Math.ceil(targetData.data.length/200)
        return fragmentCount.toString()
    } else {
        console.log("Unknown name");
        return "ERROR"
    }
}

function getDownload(seqNum,name) {
    
    var targetData = fileCache.find(fileData => fileData.name == name);
    if (targetData) {
        var stringStart = (seqNum*200)
        let fragmentCount = targetData.data.substring(stringStart,stringStart+200)
        return fragmentCount.toString()
    } else {
        console.log("Unknown name");
        return "ERROR"
    }
}

// Main DNS handler

const server = dns2.createServer({
  udp: true,
  handle: (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions;
    const { name } = question;

    // Process the request data

    function addResponse(text,index) {
        response.answers.push({
            name,
            type: Packet.TYPE.CNAME,
            class: Packet.CLASS.IN,
            ttl: index || 100,
            domain: text || "???"
        });
    }

    if (request.questions[0].type == 5) {
        let arguments = request.questions[0].name.split(".")
        if (arguments[arguments.length-1].toLowerCase() == "tech" && arguments[arguments.length-2].toLowerCase() == "dns-exfil") {

            let direction = arguments[0]

            if (direction == "up") {
                let command = arguments[1]
                
                if (command == "start") {
                    let filename = arguments[2]
                    addResponse(startUpload(filename))
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
                
            } else if (direction == "down") {
                //dn.info.applicationName.dns-exfil.tech - General; size
                //dn.get.seqNumber.applicationName.dns-exfil.tech - sequence of an application

                let command = arguments[1]
                if (command == "info") {
                    let name = arguments[2]
                    addResponse(infoDownload(name))

                } else if (command == "get") {
                    let seqNum = arguments[2]
                    let name = arguments[3]
                    addResponse(getDownload(seqNum,name))
                }
            } else {
                //console.log("Invalid direction:",direction)
            }
        } else {
            console.log(arguments)
        }
    }

    send(response);
  }
});

server.on('request', (request, response, rinfo) => {
  console.log(request.header.id, request.questions[0]);
});

server.on('listening', () => {
  console.log("ok its on?");
});

server.on('close', () => {
  console.log('server closed');
});

server.listen({
  udp: 53
});

//server.close();