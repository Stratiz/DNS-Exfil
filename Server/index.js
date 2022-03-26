const dns2 = require('dns2');

const { Packet } = dns2;

const server = dns2.createServer({
  udp: true,
  handle: (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions;
    //const { name } = question;
    response.answers.push({
      name: "Helloitworks",
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
  console.log(server.address());
});

server.on('close', () => {
  console.log('server closed');
});

//server.listen({
//  udp: 5333
//});

// eventually
//server.close();