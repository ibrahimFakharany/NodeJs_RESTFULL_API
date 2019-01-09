const GmailOperation = require('./GmailOperations');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');


const TOKEN_PATH = 'token.json';
var gmailOps = new GmailOperation();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

var agent = null;
router.post('/', (req, server_response, next) => {

    agent = new WebhookClient({
        request: req,
        response: server_response
    });

    let intentMap = new Map();
    intentMap.set('email.send.message_full_text', fullAddressEmailSending);
    intentMap.set('email.send.message_contact', messageContactEmailSending);
    intentMap.set('email.messages', gettingMessages);
    agent.handleRequest(intentMap);
});

async function fullAddressEmailSending() {
    let auth = await gmailOps.authorizeUser()
    try {
        const x = await gmailOps.sendEmail(auth, agent.parameters.email, agent.parameters.any, agent.parameters.any1);
        agent.add('sent');
    } catch (err) {
        agent.add('error in after send email catch');
    }
}

async function messageContactEmailSending() {
    let auth = await gmailOps.authorizeUser()
    try {
        const x = await gmailOps.sendEmail(auth, agent.parameters.email, agent.parameters.any, agent.parameters.any1);
        agent.add('sent');
    } catch (err) {
        agent.add('error in after send email catch');
    }
}
async function gettingMessages() {
    let auth = await gmailOps.authorizeUser()
    try {
        let x = await gmailOps.getMessages(auth);
        agent.add(x);
    } catch (err) {
        agent.add('error in after getting messages'+ err);
        console.log(err);
    }
}

module.exports = router;