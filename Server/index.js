const dns2 = require('dns2');

const { Packet } = dns2;

const server = dns2.createServer({
  udp: true,
  handle: (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions;
    const { name } = question;

    // Process the request data
    if (request.questions[0].type == 28) {
        console.log("Got desired type!")
        let arguments = request.questions[0].name.split(".")

    }


    response.answers.push({
      name,
      type: Packet.TYPE.A,
      class: Packet.CLASS.IN,
      ttl: 300,
      address: '8.8.8.8'
    });
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