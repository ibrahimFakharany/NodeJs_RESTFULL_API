const Operation = require('./Operation');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');
var agent = null;

const TOKEN_PATH = 'token.json';
var op = null; 

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
function emailSendingFullAddress() {
    var auth = op.authorize();
    op.sendEmail(auth);
}

router.post('/', (req, server_response, next) => {
    
    console.log(req.body);
    
    agent = new WebhookClient({
        request: req,
        response: server_response
    });

    op = new Operation(agent, server_response);
    let intentMap = new Map();
    intentMap.set('email.send.message_full_text', emailSendingFullAddress);
    agent.handleRequest(intentMap);
});
module.exports = router;