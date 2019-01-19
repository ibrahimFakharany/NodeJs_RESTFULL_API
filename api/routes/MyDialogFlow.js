const GmailOperation = require('./GmailOperations');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');
const Operations = require('./Operations');
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

    intentMap.set('email.messages.get.limit.number', getMessagesLimitToNumber);

    intentMap.set('Default Fallback Intent', handlingDefaultFallbackIntent);

    // getting messages
    intentMap.set('email.messages.get', emailMessagesGet);
    intentMap.set('email.messages.get.date', emailMessagesGetDate);
    intentMap.set('email.messages.get.date.between', emailMessagesGetDateInBetween);

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
let auth = null
async function messageContactEmailSending() {
    auth = await gmailOps.authorizeUser()
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
                    'message': message
                }
            })
        }

    } catch (err) {
        agent.add('error in after send email catch');
        console.log(err);

    }
}

async function sendingEmailAfterSelectingIndex() {
    let index = parseInt(agent.context.contexts.choose_index_entity.parameters.email_index_entity);
    console.log('auth -> ' + agent.context.contexts.choose_index_entity.parameters.auth);

    let x = await gmailOps.sendEmail(
        auth,
        agent.context.contexts.choose_index_entity.parameters.emails[index - 1],
        "",
        agent.context.contexts.choose_index_entity.parameters.message);
    agent.add('email sent to ' + agent.context.contexts.choose_index_entity.parameters.emails[index - 1]);

}

async function messageEmailSending() {
    console.log('message Email sending intent');
    let auth = await gmailOps.authorizeUser()
    let x = await gmailOps.sendEmail(auth, agent.parameters.email, "", agent.parameters.message);
    agent.add("email sent to " + agent.parameters.email);
}

function handlingDefaultFallbackIntent() {
    agent.add('I didn\'t get that, do you want to send it?');
}


// getting messages
async function emailMessagesGet() {
    let auth = await gmailOps.authorizeUser();

    try {

        let jsonResult = await gmailOps.getMessages(auth, -1);

        console.log(jsonResult.result);
        switch (jsonResult.success) {
            case 0:
                agent.add(jsonResult.message);
                break;
            case 1:
                var list = jsonResult.result;
                list.forEach(element => {
                    agent.add(element.subject);
                });

                break;
        }
    } catch (err) {
        agent.add('error in after getting messages' + err);
        console.log(err);
    }

}


async function emailMessagesGetDate() {
    let auth = await gmailOps.authorizeUser();
    try {
        var date = agent.parameters.date;
        var todayDate = null;
        var operation = new Operations();
        if (date) {
            todayDate = date.split("T")[0];
        }
        let jsonResult = await gmailOps.getMessagesByDate(date);
        jsonResult = operation.prepareGettingIdsResposne(jsonResult);
        let result = await gmailOps.gettingListSubjectFromMessageId(jsonResult);
        if (result.length > 0) {
            result.forEach(element => {
                agent.add(element.subject);
            });
        } else {
            agent("there is no message with specified date");
        }
    } catch (err) {
        agent.add('error in after getting messages' + err);
        console.log(err);
    }

}

async function emailMessagesGetDateInBetween() {
    var start = agent.parameters.start;
    var end = agent.parameters.end;
    if (start) {
        start = start.split("T")[0];
    }
    if (end) {
        end = end.split("T")[0];
    }
    var operation = new Operation();
    let jsonResult = await gmailOps.getMessagesByDateInBetween(start, end);
    jsonResult = operation.prepareGettingIdsResposne(jsonResult);
    let result = await gmailOps.gettingListSubjectFromMessageId(jsonResult);
    if (result.length > 0) {
        result.forEach(element => {
            agent.add(element.subject);
        });
    } else {
        agent("there is no message with specified date");
    }
}

async function getMessagesLimitToNumber() {
    var numberMaxResults = agent.parameters.number;
    let jsonResult = await gmailOps.getMessages(auth, numberMaxResults);

    switch (jsonResult.success) {
        case 0:
            agent.add(jsonResult.message);
            break;
        case 1:
            agent.add(jsonResult.result.subject);
            break;
    }
}


module.exports = router;