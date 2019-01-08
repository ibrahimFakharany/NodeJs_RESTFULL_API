const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { googleAction } = require('actions-on-google');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const SCOPES = ['https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.insert',
    'https://www.googleapis.com/auth/gmail.send'];

const TOKEN_PATH = 'token.json';
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

function welcome(agent) {
    agent.add(`helloooo`);
}


router.post('/', (req, server_response, next) => {
    console.log(req.body);
    const agent = new WebhookClient({
        request: req,
        response: server_response
    });
    let intentMap = new Map();
    intentMap.set('email.send.message_full_address', sendinEmailFullAddress);
    // intentMap.set('your intent name here', yourFunctionHandler);
    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});
module.exports = router;



