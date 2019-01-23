const GmailOperation = require('./GmailOperations');
const express = require('express');
const bodyParser = require('body-parser');
const ArrayList = require('arraylist');
const router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');
const Operations = require('./Operations');
const TOKEN_PATH = 'token.json';
var gmailOps = new GmailOperation();
let auth = null
var agent = null;
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
// intents names 
const choose_index_entity = "choose_index_entity";
const selecting_email_context = "selecting_email_context";
const handling_mail_context = "handling_mail_context";
const get_messages_context = "get_messages_context";
const default_context_life_span = 5

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
    intentMap.set('Default Fallback Intent', handlingDefaultFallbackIntent);
    // getting messages
    intentMap.set('email.messages.get', emailMessagesGet);
    intentMap.set('email.messages.get.date', emailMessagesGetDate);
    intentMap.set('email.messages.get.date.between', emailMessagesGetDateInBetween);
    intentMap.set('email.messages.get.contact_name', emailMessagesGetContactName);
    intentMap.set('email.messages.get.limit.number', getMessagesLimitToNumber);
    intentMap.set('email.messages.get.contact_name.subject', getMessagesFromSubject);
    intentMap.set('email.selecting', emailSelecting);
    intentMap.set('email.messages.send_reply', emailMessageSendingReply);
    intentMap.set('email.messages.get.count.single', emailMessagesGettingLastSingleMail);
    intentMap.set('email.message.show_body', emailMessageShowBody);
    intentMap.set('email.message.forward', emailMessageForward);
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
                'name': choose_index_entity,
                'lifespan': lifespan,
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

        switch (jsonResult.success) {
            case 0:
                agent.add(jsonResult.message);
                break;
            case 1:
                console.log(jsonResult.result);
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

async function emailMessagesGettingLastSingleMail() {
    let jsonResult = await gmailOps.getMessagesWithLimit(1);
    console.log(JSON.stringify(jsonResult));
    var message = await gmailOps.getMessagesByMessageId(jsonResult.body.messages[0].id);
    var deliveredTo = null;
    var from = null;
    var subject = null;
    var date = null;
    var messageId = null;
    var body = null;
    message.payload.headers.forEach((header) => {
        let key = header.name.toString().toUpperCase();
        console.log('key ' + key + ' ' + 'Subject'.toUpperCase()+' '+' header value '+header.value);
        
        if (key == "Delivered-To".toUpperCase()) {
            deliveredTo = header.value;
        } else if (key == "From".toUpperCase()) {
            from = header.value;
        } else if (key == 'Subject'.toUpperCase()) {
            subject = header.value;
        } else if (key == "Date".toUpperCase()) {
            date = header.value;
        } else if (key == "Message-ID".toUpperCase()) {
            messageId = header.value;
        }
    });
    if(subject == ''){
        subject = 'no subject'
    }
    console.log('mimeType ' + message.payload.mimeType);
    console.log('subject ' + subject);
    let mimeType = message.payload.mimeType;
    if (message.payload.mimeType == "text/html") {
        body = null;
        message = null;
    } else if (message.payload.mimeType == "multipart/alternative") {
        message.payload.parts.forEach(element => {
            if (element.mimeType == "text/plain") {
                body = element.body.data;
            }
        });

    }
    var msgData = {
        "id": jsonResult.body.messages[0].id,
        "deliveredTo": deliveredTo,
        "from": from,
        "subject": subject,
        "date": date,
        "messageId": messageId,
        "body": body,
        "mimeType": mimeType
    }

    agent.context.set({
        'name': handling_mail_context,
        'lifespan': default_context_life_span,
        'parameters': {
            'msg': msgData,
            'message': message
        }
    });
    agent.add(subject);
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
        let jsonResult = await gmailOps.getMessagesByDate(todayDate);
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
    var operation = new Operations();
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

async function emailMessagesGetContactName() {
    var state = agent.parameters.state;
    var contact_name = agent.parameters.contact_name;
    let response = await gmailOps.getContacts(contact_name);
    var operation = new Operations();
    switch (response.sent) {
        case 0:
            // get messages by this email
            let jsonResult = await gmailOps.getMessagesByContactName(state, contact_name);
            jsonResult = operation.prepareGettingIdsResposne(jsonResult);
            let result = await gmailOps.gettingListSubjectFromMessageId(jsonResult);
            if (result.length > 0) {
                result.forEach(element => {
                    agent.add(element.subject);
                });
            } else {
                agent.add("there is no messages for specified contact");
            }
            break;
        case 1:
            // show these emails to user to select one
            let emails = response.emails;
            agent.add("which one did you mean?\n.. choose one by copy and pasting it in the message!");
            agent.context.set({
                'name': selecting_email_context,
                'lifespan': default_context_life_span,
                'parameters': {
                    'from': get_messages_context,
                    'state': state,
                }
            });
            agent.add(emails);

            break;

        case -1:
            // show there is no contact with this name
            agent.add('there is no contact with this name');
            break;
    }
}

async function emailSelecting() {
    let fromContext = agent.context.contexts.selecting_email_context.parameters.from
    if (fromContext == get_messages_context) {
        let state = agent.context.contexts.selecting_email_context.parameters.state
        let email = agent.parameters.email;
        var operation = new Operations();
        let jsonResult = await gmailOps.getMessagesByContactName(state, email);
        jsonResult = operation.prepareGettingIdsResposne(jsonResult);
        let result = await gmailOps.gettingListSubjectFromMessageId(jsonResult);
        if (result.length > 0) {
            result.forEach(element => {
                agent.add(element.subject);
            });
        } else {
            agent.add("there is no messages for specified contact");
        }
    } else if (fromContext == handling_mail_context) {
        let email = agent.parameters.email;
        agent.context.set({
            'name': handling_mail_context,
            'lifespan': default_context_life_span,
            'parameters': {
                'from': selecting_email_context,
                'email': email,
                'msg': agent.context.contexts.selecting_email_context.parameters.msg,
                'message': agent.context.contexts.selecting_email_context.parameters.messasge
            }
        })

    }


}

async function getMessagesFromSubject() {
    let state = agent.context.contexts.get_body_of_message_by_subject.parameters.state
    let email = agent.context.contexts.get_body_of_message_by_subject.parameters.email
    let subject = agent.parameters.subject;
    let result = await gmailOps.getMessagesBySubject(subject, state, email);
    let size = result.messages.length;
    let msgs = result.messages;

    if (size > 1) {
        // show to user 
        console.log("#of messages returned by subject is greater than one");

        let listOfPossibleMessages = new ArrayList()
        let promise = new Promise(async (resolve, reject) => {
            msgs.forEach(async element => {
                let id = element.id;
                console.log("id " + id);
                let possibleMessageWithThisSubject = await gmailOps.getDateEmailSubjectWithMessageId(id);
                listOfPossibleMessages.add(possibleMessageWithThisSubject);
            });
            resolve(listOfPossibleMessages);
        });

        let thisResult = await promise;

        console.log(thisResult);

        agent.add("please select message by typing its index number! ");
        thisResult.forEach(element => {
            agent.add(element.date);
            agent.add(element.email);
            agent.add(element.subject);
        })

    } else {
        // get body with this id 
        let id = msgs[0].id
        let message = await gmailOps.getMessagesByMessageId(id);
        console.log(message);
        let body = null;
        message.payload.parts.forEach(element => {
            if (element.mimeType == "text/plain") {
                body = element.body.data
            }
        })
        agent.add(gmailOps.decodeMessageBody(body));
        agent.context.set({
            'name': send_reply_to_the_email,
            'lifespan': default_context_life_span,
            'parameters': {
                'message': message
            }
        });
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

async function emailMessageSendingReply() {
    let auth = await gmailOps.authorizeUser()
    let message = agent.context.contexts.send_reply_to_the_email.parameters.message
    let userReply = agent.parameters.reply;
    let reply = await gmailOps.sendingReply(auth, userReply, message);
    agent.add(reply);
}

async function emailMessageShowBody() {
    let msg = agent.context.contexts.handling_mail_context.parameters.msg
    let message = agent.context.contexts.handling_mail_context.parameters.message
    let body = msg.body;
    if (body == null) {
        agent.add("No body to show, this might because the body is html page that couldn't or there is no body in the message");
        agent.context.set({
            'name': handling_mail_context,
            'lifespan': default_context_life_span,
            'parameters': {
                'msg': msg,
                'message': message
            }
        });
    } else {
        agent.add(gmailOps.decodeMessageBody(body));
        msg.body = body;
        agent.context.set({
            'name': handling_mail_context,
            'lifespan': default_context_life_span,
            'parameters': {
                'msg': msg,
                'message': message
            }
        });
    }
}

async function emailMessageForward() {
    let from = agent.context.contexts.handling_mail_context.parameters.from
    let auth = await gmailOps.authorizeUser()
    if (from == selecting_email_context) {
        let email = agent.context.contexts.handling_mail_context.parameters.email;
        let msg = agent.context.contexts.handling_mail_context.parameters.msg;
        let message = agent.context.contexts.handling_mail_context.parameters.message;
        if (message == null || typeof message === 'undefined') {
            // getting the message by the id
            let id = msg.id;
            let message = await gmailOps.getMessagesByMessageId(id);
            let agentMessage = await gmailOps.forwardMessage(message, email, msg.deliveredTo);
            agent.add(agentMessage);
        }
    } else {
        //from is undefined or from another context 
        let msg = agent.context.contexts.handling_mail_context.parameters.msg
        let message = agent.context.contexts.handling_mail_context.parameters.message

        let email = agent.parameters.email;
        console.log(email);

        let contacts = await gmailOps.getContacts(email);

        if (contacts.sent == 1) {
            contacts.emails.forEach(element => {
                agent.add(element);
            });
            agent.context.set({
                'name': selecting_email_context,
                'lifespan': default_context_life_span,
                'parameters': {
                    'from': handling_mail_context,
                    'msg': msg,
                    'message': message
                }
            });

        } else if (contacts.sent == 0) {
            let foundEmail = contacts.email;
            let returnedMessage = null
            if (message == null || typeof message === 'undefined') {
                // get the message and send it
                let id = msg.id;
                returnedMessage = await gmailOps.getMessagesByMessageId(id);
            } else {
                returnedMessage = message;
            }
            let agentMessage = await gmailOps.forwardMessage(auth, returnedMessage, foundEmail, msg.deliveredTo);
            agent.add(agentMessage);
        } else {
            // show contact couldn't found      
        }
    }


}

module.exports = router;