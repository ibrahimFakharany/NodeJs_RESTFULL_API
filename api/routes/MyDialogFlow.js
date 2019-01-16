const GmailOperation = require('./GmailOperations');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');

// intents names 

const choose_index_entity = "choose_index_entity";

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
    intentMap.set('email.send.message_email', messageEmailSending);
    intentMap.set('email.selecting.index', sendingEmailAfterSelectingIndex);
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
        let message = agent.parameters.message;

        let ress = await gmailOps.getContacts(agent.parameters.contact_name);

        console.log("resposne.sent = " + ress.sent);
        if (ress.sent == 0) {
            console.log("send email ");
            //send email
            let x = await gmailOps.sendEmail(auth, ress.email, "", message);
            agent.add("email sent to " + ress.email);
        } else if (ress.sent == -1) {
            console.log("show not recognize message ");
            agent.add(ress.message);
        } else if (ress.sent == 1) {
            console.log("show emails ");
            // show the message couldn't recognize
            agent.add("which one did you mean?");

            agent.add(ress.emails);
            agent.context.set({
                'name': 'choose_index_entity',
                'lifespan': 5,
                'parameters': {
                    'emails': ress.emails,
                    'message' : message, 
                    'auth': auth
                }
            })
        }

    } catch (err) {
        agent.add('error in after send email catch');
        console.log(err);

    }
}

async function sendingEmailAfterSelectingIndex() {
    console.log("intent sending email after selecting one is called");
    console.log(JSON.stringify(agent.context));
    let index = parseInt(agent.context.contexts.choose_index_entity.parameters.email_index_entity);
    console.log("index : " + index);
    let x = await gmailOps.sendEmail(
        agent.context.contexts.choose_index_entity.parameters.auth, 
        agent.context.contexts.choose_index_entity.parameters.emails[index-1],
        "",
        agent.context.contexts.choose_index_entity.parameters.message);
    agent.add('email sent to '+agent.context.contexts.choose_index_entity.parameters.emails[index-1]);
   
}

async function messageEmailSending() {
    console.log('message Email sending intent');
    let auth = await gmailOps.authorizeUser()
    let x = await gmailOps.sendEmail(auth, agent.parameters.email, "", agent.parameters.message);
    agent.add("email sent to " + agent.parameters.email);
}
async function gettingMessages() {
    let auth = await gmailOps.authorizeUser()
    try {
        gmailOps.getMessages(auth);
        agent.add('hello');
    } catch (err) {
        agent.add('error in after getting messages' + err);
        console.log(err);
    }
}

module.exports = router;