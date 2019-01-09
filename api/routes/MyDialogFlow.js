const Operation = require('./Operation');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');
var agent = null;

const TOKEN_PATH = 'token.json';
var op = new Operation();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
async function emailSendingFullAddress() {
    let auth = await op.authorizeUser();
    console.log('authentication ---> ' +typeof auth);
    op.sendEmail(auth);
}

router.post('/', (req, server_response, next) => {

    agent = new WebhookClient({
        request: req,
        response: server_response
    });

    op.server_response = server_response;
    op.agent = agent; 
    let intentMap = new Map();
    intentMap.set('email.send.message_full_text', emailSendingFullAddress);
    agent.handleRequest(intentMap);
});
module.exports = router;