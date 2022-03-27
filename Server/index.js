// Author: Harrison Lewis (@Stratiz)
require('dotenv').config()

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilio = require('twilio')
const twilioClient = twilio(accountSid, authToken);

const database = require("./database");

// DNS
const dns2 = require('dns2');

const { Packet } = dns2;

const DOWNLOAD_CNAMES = 1;
const FRAGMENT_LENGTH = 20;

let fileCache = [];

let currentKey = 0
let lastTextTime = Date.now()/1000

// For uploading

async function startUpload(filename) {
    var targetData = fileCache.find(fileData => fileData.name == filename);
    var databaseData = await database.getHash(filename)
    if (!targetData && !databaseData[0]) {
        currentKey += 1
        fileCache.push({
            name: filename,
            key: currentKey,
            currentSequence: 0,
            base64: "",
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
        database.addHash(targetData.name,targetData.base64)
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
            targetData.base64 = targetData.base64 + data;
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

function infoDownload(name) {
    
    var targetData = fileCache.find(fileData => fileData.name == name);
    if (targetData) {
        let fragmentCount = Math.ceil((targetData.base64.length/FRAGMENT_LENGTH)/DOWNLOAD_CNAMES)
        return fragmentCount.toString()
    } else {
        console.log("Unknown name");
        return "DNE"
    }
}

async function getDownload(name,segNum,callback) {
    
    var targetData = fileCache.find(fileData => fileData.name == name);
    if (!targetData) {
        var targetData = await database.getHash(filename)
    }
    if (targetData) {
        var fragGroupStart = (segNum*(FRAGMENT_LENGTH*DOWNLOAD_CNAMES))
        let fragGroup = targetData.base64.substring(fragGroupStart,fragGroupStart+(FRAGMENT_LENGTH*DOWNLOAD_CNAMES))
        let fragmentCount = Math.ceil((targetData.base64.length/FRAGMENT_LENGTH))

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

// Main DNS handler

const server = dns2.createServer({
  udp: true,
  handle: async (request, send, rinfo) => {
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
                    addResponse(infoDownload(name))

                } else if (command == "get") {
                    let seqNum = arguments[3]
                    let name = arguments[2]
                    await getDownload(name,seqNum,addResponse)
                    console.log(response.answers)
                }
            



            } else if (direction == "text") {
                let number = arguments[1];
                if (number.length == 10) {
                    if ((Date.now()/1000) - lastTextTime > 5) {
                        lastTextTime = (Date.now()/1000)
                        addResponse("working")
                        twilioClient.messages
                            .create({
                                body: 'Hello! thanks for your interest in DNS exfiltration! \n\nPlease head to our github page for more information! \n\n https://github.com/Stratiz/DNS-Infil',
                                from: '+15402991875',
                                to: '+1'+number.toString()
                            })
                            .then(message => console.log(message.sid))
                            .catch(err => console.log("failed to send text :("))
                    } else {
                        addResponse("try-again-later")
                    }
                } else {
                    console.log("Invalid number length",number);
                    addResponse("invalid-number")
                }
            }
        } else {
            console.log(arguments)
        }
    } else {
        response.answers.push({
            name,
            type: Packet.TYPE.A,
            class: Packet.CLASS.IN,
            ttl: 300,
            address: "8.8.8.8"
        });
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