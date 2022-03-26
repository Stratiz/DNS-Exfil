const dns2 = require('dns2');

const { Packet } = dns2;

let fileCache = [];

let currentKey = 0

function startUpload(filename) {
    currentKey += 1
    fileCache.push({
        name: filename,
        key: currentKey,
        currentSequence: 0,
        base64: "",
        finished: false
    })
    return currentKey
}

function endUpload(key) {
    
    var foundIndex = fileCache.find(fileData => fileData.key == key);
    if (foundIndex) {
        let targetData = fileCache[foundIndex]
        targetData.finished = true
        targetData.key = null
        return "OK"
    } else {
        console.log("Unknown key");
        return "ERROR"
    }
}

function fragmentUpload(key,seq,data) {
    var foundIndex = fileCache.find(fileData => fileData.key == key);
    if (foundIndex) {
        let targetData = fileCache[foundIndex]
        if (targetData.currentSequence == Number(seq)) {
            targetData.currentSequence += 1;
            targetData.base64 = targetData.base64 + data;
        } else {
            console.log("Invalid sequence");
            return "ERROR"
        }
        
    } else {
        console.log("Unknown key for fragment");
        return "ERROR"
    }
}

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
            domain: text
        });
    }

    if (request.questions[0].type == 28) {
        let arguments = request.questions[0].name.split(".")
        if (arugments[arguments.length-1] == "tech" && arugments[arguments.length-2] == "dns-exfil") {
            console.log("Valid end args, processing...")

            let direction = arguments[1]

            if (direction == "up") {
                let command = arguments[2]
                
                if (command == "start") {
                    let filename = arguments[3]
                    addResponse(startUpload(filename))
                } else if (command == "send") {
                    let key = arugments[3]
                    let seqNum = arguments[4]
                    let data = arguments[5]
                    
                } else if (command == "end") {
                    let key = arguments[3]
                    addResponse(endUpload(key))
                } else {
                    console.log("Invalid up command: ",command)
                }
                
            } else if (direction == "down") {

            } else {
                console.log("Invalid direction:",direction)
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

// eventually
//server.close();