const twilio = require('twilio')
const http = require('http');
const express = require("express")
const bodyParser = require('body-parser');
const CNAME_Handler = require("./DNS_handlers/CNAME")
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilioClient = twilio(accountSid, authToken);

const MessagingResponse = twilio.twiml.MessagingResponse;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  req.body.Body = req.body.Body.toLowerCase();
  if (req.body.Body == 'list loaded') {
    var responseString = "Here is a list of loaded file names: \n\n";
    for (let fileData of CNAME_Handler.Cache) {
        //if (fileData.finished == true) {
        console.log("found file",fileData)
        responseString += fileData.name + "\n";
        //}
    }
    twiml.message(responseString);
  } else {
    twiml.message('Invalid command, please check the github page for a list of commands.');
  }

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

http.createServer(app).listen(80, () => {
  console.log('Express server listening on port 80');
});

app.get("/",(req,res) =>{
    res.sendStatus(418);
})

module.exports = { 
    sendMessage: function(targetNumber,text) {
        twilioClient.messages
            .create({
                body: text,
                from: '+15402991875',
                to: '+1'+targetNumber.toString()
            })
            .then(message => console.log(message.sid))
            .catch(err => console.log("failed to send text :("))
    }
}