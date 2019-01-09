const Operation = require('./Operation');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');


const TOKEN_PATH = 'token.json';
var op = new Operation();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

var agent = null;
router.post('/', (req, server_response, next) => {

    agent = new WebhookClient({
        request: req,
        response: server_response
    });

    let intentMap = new Map();
    intentMap.set('email.send.message_full_text', emailSendingFullAddress);
    agent.handleRequest(intentMap);


    
});

async function emailSendingFullAddress() {
    let auth = await op.authorizeUser()
    try {

        const x = await op.sendEmail(auth, agent.parameters.email, agent.parameters.any, agent.parameters.any1);
        agent.add('sent');
    } catch (err) {
        agent.add('error in after send email catch');
    }
}

module.exports = router;