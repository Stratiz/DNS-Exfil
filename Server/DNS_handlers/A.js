const twilioHandler = require('../twilioHandler');
let lastTextTime = Date.now()/1000

module.exports = function(arguments,addResponse) {
    let command = arguments[0]
    if (command == "text") {
        let number = arguments[1];
        if (number.length == 10) {
            if ((Date.now()/1000) - lastTextTime > 5) {
                lastTextTime = (Date.now()/1000)
                addResponse("2.0.0.0")
                twilioHandler.sendMessage(number,'Hello! thanks for your interest in DNS exfiltration! \n\nPlease head to our github page for more information! \n\n https://github.com/Stratiz/DNS-Infil')
            } else {
                addResponse("4.0.4.0")
            }
        } else {
            console.log("Invalid number length",number);
            addResponse("2.0.3.0")
        }
    }

}