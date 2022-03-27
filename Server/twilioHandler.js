const twilio = require('twilio')
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilioClient = twilio(accountSid, authToken);

 

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