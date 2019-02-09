const GmailOperation = require('./GmailOperations');
const GmailAuth = require('./GmailAuth');
const Constants = require('./Constants');
const express = require('express');
const bodyParser = require('body-parser');
const ArrayList = require('arraylist');
const router = express.Router();
const { WebhookClient } = require('dialogflow-fulfillment');
const Operations = require('./Operations');
const TOKEN_PATH = 'token.json';
var gmailOps = new GmailOperation();
var gmailAuth = new GmailAuth();
let auth = null
var agent = null;
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const delete_context_life_span = 0

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
    intentMap.set(Constants.emailMessagesGetText, emailMessagesGet);
    intentMap.set(Constants.emailMessagesGetDateText, emailMessagesGetDate);
    intentMap.set(Constants.emailMessagesGetContactNameText, emailMessagesGetContactName);
    intentMap.set(Constants.emailMessagesGetCountSingleText, emailMessagesGetCountSingle);
    intentMap.set(Constants.emailMessagesGetCountManyText, emailMessagesGetCountMany);
    // combinations methods
    intentMap.set(Constants.emailMessagesGetDateContactNameText, emailMessagesGetDateContactName);
    intentMap.set(Constants.emailMessagesGetContactNameCountSingleText, emailMessagesGetContactNameCountSingle);
    intentMap.set(Constants.emailMessagesGetContactNameCountManyText, emailMessagesGetContactNameCountMany);
    intentMap.set(Constants.emailMessagesGetDateCountSingleText, emailMessagesGetDateCountSingle);
    intentMap.set(Constants.emailMessagesGetDateCountManyText, emailMessagesGetDateCountMany);
    intentMap.set(Constants.emailMessagesGetDateContactNameCountSingleText, emailMessagesGetDateContactNameCountSingle);
    intentMap.set(Constants.emailMessagesGetDateContactNameCountManyText, emailMessagesGetDateContactNameCountMany);

    //followup intents getting messages 

    intentMap.set(Constants.emailMessagesGetFollowupDateText, emailMessagesGetFollowupDate);
    intentMap.set(Constants.emailMessagesGetFollowupContactNameText, emailMessagesGetFollowupContactName);
    intentMap.set(Constants.emailMessagesGetFollowupCountText, emailMessagesGetFollowupCount);
    intentMap.set(Constants.emailMessagesGetFollowupContactNameCountText, emailMessagesGetFollowupContactNameCount);
    intentMap.set(Constants.emailMessagesGetFollowupDateCountText, emailMessagesGetFollowupDateCount);
    intentMap.set(Constants.emailMessagesGetFollowupDateContactNameText, emailMessagesGetFollowupDateContactName);
    intentMap.set(Constants.emailMessagesGetFollowupDateContactNameCountText, emailMessagesGetFollowupDateContactNameCount);

    intentMap.set(Constants.emailMessagesShowBody, emailMessageShowBody)
    intentMap.set(Constants.emailMessagesShowBodyFromListText, emailMessagesShowBodyFromList)
    intentMap.set(Constants.userRegistrationText, handlingUserRegistration);
    // intentMap.set('email.messages.get.date.between', emailMessagesGetDateInBetween);
    intentMap.set('email.selecting', emailSelecting);
    intentMap.set('email.messages.send_reply', emailMessageSendingReply);
    intentMap.set('email.message.show_body', emailMessageShowBody);
    intentMap.set('email.message.forward', emailMessageForward);
    agent.handleRequest(intentMap);
});


async function handlingUserRegistration() {
    let code = agent.parameters.code
    agent.add("you entered ", code);
    let auth = await gmailAuth.getAuthObjectFromCode(code);

}

//sending email
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
                'name': get_contacts_context,
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
function deleteGetMessagesContext() {
    agent.context.set({
        'name': Constants.getting_mails,
        'lifespan': 0
    });
}
async function emailMessagesGet() {

    let result = await gmailAuth.getToken();
    switch (result.status) {
        case 1:
            //get access token 
            deleteGetMessagesContext();

            let jsonResult = await gmailOps.getMessages(result.data, - 1);
            let list = null;
            switch (jsonResult.success) {
                case 0:
                    agent.add(jsonResult.message);
                    break;
                case 1:
                    list = jsonResult.result;
                    list.forEach(element => {
                        agent.add(element.subject);
                    });
                    agent.context.set({
                        'name': Constants.handling_subject_context,
                        'lifespan': default_context_life_span,
                        'parameters': {
                            'fromIntent': Constants.emailMessagesGet,
                            'messages': list
                        }
                    });


                    console.log('the get mails context setted');
                    break;
            }

            break;
        case 2:
            //show login link 
            //ask for code 
            agent.add(result.data);
            agent.context.set({
                'name': 'handling_registration',
                'lifespan': 1
            })
            break;
    }



}
async function emailMessagesGetContactName() {
    deleteGetMessagesContext();
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
                agent.context.set({
                    'name': handling_mail_context,
                    'lifespan': default_context_life_span,
                    'parameters': {
                        'result': result
                    }
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
                'name': get_contacts_context,
                'lifespan': default_context_life_span,
                'parameters': {
                    'from': getting_mails,
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
//date
async function emailMessagesGetDate() {
    try {
        deleteGetMessagesContext();
        var date = agent.parameters.date;
        var todayDate = null;
        var operation = new Operations();
        if (date) {
            todayDate = date.split("T")[0];
            contextParameters.date = todayDate;

        }
        let jsonResult = await gmailOps.getMessagesByDate(todayDate);
        jsonResult = operation.prepareGettingIdsResposne(jsonResult);
        let result = await gmailOps.gettingListSubjectFromMessageId(jsonResult);
        if (result.length > 0) {
            result.forEach(element => {
                agent.add(element.subject);
            });
            agent.context.set({
                'name': getting_mails,
                'lifespan': default_context_life_span,
                'parameters': contextParameters
            });
        } else {
            agent("there is no message with specified date");
        }

    } catch (err) {
        agent.add('error in after getting messages' + err);
        console.log(err);
    }

}
//count_single
async function emailMessagesGetCountSingle() {
    let jsonResult = await gmailOps.getMessagesWithLimit(1);
    console.log(JSON.stringify(jsonResult));
    var message = await gmailOps.getMessagesByMessageId(jsonResult.body.messages[0].id);
    let operation = new Operations();
    let msg = operation.getMsg(message);
    var msgData = msg

    agent.context.set({
        'name': handling_mail_context,
        'lifespan': default_context_life_span,
        'parameters': {
            'msg': msgData,
            'message': message
        }
    });
    agent.add(msgData.subject);
}
//count_many
async function emailMessagesGetCountMany() {
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
//date contact_name
async function emailMessagesGetDateContactName() {

}
//date count_single
async function emailMessagesGetDateCountSingle() { }
//date count_many
async function emailMessagesGetDateCountMany() { }
// contact_name count_single
async function emailMessagesGetContactNameCountSingle() { }
// contact_name count_many
async function emailMessagesGetContactNameCountMany() { }
//date contact_name count_single
async function emailMessagesGetDateContactNameCountSingle() { }
//date contact_name count_many
async function emailMessagesGetDateContactNameCountMany() { }
// followup Intents 
async function emailMessagesGetFollowupDate() {
    let params = agent.context.contexts.getting_mails.parameters
    let date = agent.parameters.date;
    // set date in the context 
    params.date = date
    agent.context.set({
        'name': getting_mails,
        'lifespan': default_context_life_span,
        'parameters': params
    });

    // query
    let contact_name = params.contact_name;
    let state = params.state;
    let count = params.count;
    let result = await gmailOps.queryMessages(date, contact_name, state, count);
    console.log(result);
    result = {
        'data': result
    }
    result = await gmailOps.gettingListSubjectFromMessageId(result);
    result.forEach(element => {
        agent.add(element.subject);
    });
}
async function emailMessagesGetFollowupContactName() {
    let params = agent.context.contexts.getting_mails.parameters
    let contact_name = agent.parameters.contact_name;
    // set date in the context 
    params.contact_name = contact_name
    agent.context.set({
        'name': getting_mails,
        'lifespan': default_context_life_span,
        'parameters': params
    });

    // query
    let date = params.date;
    let state = params.state;
    let count = params.count;
    let result = await gmailOps.queryMessages(date, contact_name, state, count);
    console.log(result);
    result = {
        'data': result
    }
    result = await gmailOps.gettingListSubjectFromMessageId(result);
    result.forEach(element => {
        agent.add(element.subject);
    });
}
async function emailMessagesGetFollowupCount() {
    let params = agent.context.contexts.getting_mails.parameters
    let count = agent.parameters.count;
    // set date in the context 
    params.count = count
    agent.context.set({
        'name': getting_mails,
        'lifespan': default_context_life_span,
        'parameters': params
    });

    // query
    let date = params.date;
    let state = params.state;
    let contact_name = params.contact_name;
    let result = await gmailOps.queryMessages(date, contact_name, state, count);
    console.log(result);
    result = {
        'data': result
    }
    result = await gmailOps.gettingListSubjectFromMessageId(result);
    result.forEach(element => {
        agent.add(element.subject);
    });
}
async function emailMessagesGetFollowupContactNameCount() { }
async function emailMessagesGetFollowupDateCount() { }
async function emailMessagesGetFollowupDateContactName() { }
async function emailMessagesGetFollowupDateContactNameCount() { }


//handling contacts
async function emailSelecting() {
    let auth = await gmailOps.authorizeUser();
    let fromContext = agent.context.contexts.selecting_email_context.parameters.from
    if (fromContext == getting_mails) {
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
        let foundEmail = agent.parameters.email;
        let msg = agent.context.contexts.selecting_email_context.parameters.msg;
        let message = agent.context.contexts.selecting_email_context.parameters.messasge;
        let returnedMessage = null
        if (message == null || typeof message === 'undefined') {
            // get the message and send it
            let id = msg.id;
            returnedMessage = await gmailOps.getMessagesByMessageId(id);
        } else {
            returnedMessage = message;
        }
        let agentMessage = await gmailOps.forwardMessage(auth, returnedMessage, foundEmail, msg.deliveredTo);
        agent.context.set({
            'name': handling_mail_context,
            'lifespan': default_context_life_span,
            'parameters': {
                'from': get_contacts_context,
                'email': foundEmail,
                'msg': msg,
                'message': message
            }
        });
        agent.add(agentMessage);

    }


}

// handling mails
async function emailMessageShowBody() {
    let msg = agent.context.contexts.handling_mails.parameters.msg
    let message = agent.context.contexts.handling_mails.parameters.message
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
async function emailMessagesShowBodyFromList() {
    let result = agent.context.contexts.handling_mails.parameters.result
    let subject = agent.parameters.subject
    let id = null;
    result.forEach(element => {
        if (element.subject.toString().toUpperCase() == subject.toString().toUpperCase()) {
            id = element.id
        }
    })

    if (id != null) {
        let message = await gmailOps.getMessagesByMessageId(id);
        var operation = new Operations();
        let msg = operation.getMsg(message);
        agent.add(
            gmailOps.decodeMessageBody(msg.body));
        agent.context.set({
            'name': handling_mail_context,
            'lifespan': default_context_life_span,
            'parameters': {
                'msg': msg,
                'message': message
            }
        });
    } else {
        agent.add("please select a valid message");
    }
}
async function emailMessageForward() {
    let from = agent.context.contexts.handling_mails.parameters.from
    let auth = await gmailOps.authorizeUser()
    if (from == get_contacts_context) {
        let email = agent.context.contexts.handling_mails.parameters.email;
        let msg = agent.context.contexts.handling_mails.parameters.msg;
        let message = agent.context.contexts.handling_mails.parameters.message;
        if (message == null || typeof message === 'undefined') {
            // getting the message by the id
            let id = msg.id;
            let message = await gmailOps.getMessagesByMessageId(id);
            let agentMessage = await gmailOps.forwardMessage(message, email, msg.deliveredTo);
            agent.add(agentMessage);
        }
    } else {
        //from is undefined or from another context 
        let msg = agent.context.contexts.handling_mails.parameters.msg
        let message = agent.context.contexts.handling_mails.parameters.message
        let email = agent.parameters.email;
        console.log(email);
        let contacts = await gmailOps.getContacts(email);
        console.log(JSON.stringify(contacts));
        if (contacts.sent == 1) {
            contacts.emails.forEach(element => {
                agent.add(element);
            });
            agent.context.set({
                'name': get_contacts_context,
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
async function emailMessageSendingReply() {
    let auth = await gmailOps.authorizeUser()
    let msg = agent.context.contexts.handling_mails.parameters.msg;
    let message = agent.context.contexts.handling_mails.parameters.message;
    if (message == null || message == 'undefined') {
        // getting message with the id
        let id = msg.id;
        message = await gmailOps.getMessagesByMessageId(id);
    }
    let userReply = agent.parameters.reply;
    console.log('message ' + message);
    let reply = await gmailOps.sendingReply(auth, userReply, message);
    agent.add(reply);
}

module.exports = router;