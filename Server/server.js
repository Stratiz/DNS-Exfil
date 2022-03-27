// Author: Harrison Lewis (@Stratiz)
require('dotenv').config()

const CNAME_Handler = require("./DNS_handlers/CNAME")
const A_Handler = require("./DNS_handlers/A")
// DNS
const dns2 = require('dns2');
const { Packet } = dns2;


// Main DNS handler

const server = dns2.createServer({
  udp: true,
  handle: async (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions;
    const { name } = question;

    // Process the request data

    function addCNAMEResponse(text,) {
        response.answers.push({
            name,
            type: Packet.TYPE.CNAME,
            class: Packet.CLASS.IN,
            ttl: index || 100,
            domain: text || "???"
        });
    }
    function addAResponse(text) {
      response.answers.push({
          name,
          type: Packet.TYPE.CNAME,
          class: Packet.CLASS.IN,
          ttl: 100,
          address: text || "8.8.8.8"
      });
  }

    let arguments = request.questions[0].name.split(".")
    if (arguments[arguments.length-1].toLowerCase() == "tech" && arguments[arguments.length-2].toLowerCase() == "dns-exfil") {
        if (request.questions[0].type == 5) {
          CNAME_Handler(arguments,addCNAMEResponse);
        } else if (request.questions[0].type == 1) {
          A_Handler(arguments,addAResponse);
        } else {
          addAResponse();
        }
    }
    
    send(response);
  }
});

server.on('request', (request, response, rinfo) => {
  console.log(request.header.id, request.questions[0]);
});

server.on('listening', () => {
  console.log("DNS Server ready.");
});

server.on('close', () => {
  console.log('DNS Server closed');
});

server.listen({
  udp: 5333
});

//server.close();