const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly',
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send'];
//sending email 
var toEmail = "";
var subjectEmail = "";
var bodyEmail = "";



const TOKEN_PATH = 'token.json';
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.post('/', (req, server_response, next) => {
    console.log(req.body.queryResult.intent.displayName);
    var intentDisplayName = req.body.queryResult.intent.displayName;
    switch (intentDisplayName) {
        case "sendingemail":
            toEmail = req.body.queryResult.parameters.email[0];
            subjectEmail = req.body.queryResult.parameters.any[0];
            bodyEmail = req.body.queryResult.parameters.any1[0];
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Gmail API.
                authorize(JSON.parse(content), sendEmail, server_response);
            });
            break;
        case "restaurant.booking.create":
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Gmail API.
                authorize(JSON.parse(content), listLabels, server_response);
            });
            break;
        default:
            res.status(200).json({
                fulfillmentMessages: [
                    {
                        text: {
                            text: [
                                "sorry i couldn't understand your request"
                            ]
                        }
                    }
                ]
            });
            break;
    }


});
function listLabels(auth, res_api) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.labels.list({
        userId: 'me',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const labels = res.data.labels;
        if (labels.length) {
            console.log('Labels:');
            labels.forEach((label) => {
                console.log(`- ${label.name}`);
            });
            res_api.status(200).json({
                fulfillmentMessages: [
                    {
                        text: {
                            text: [
                                "from my webservice"
                            ]
                        }
                    }
                ]
            });
        } else {
            console.log('No labels found.');
        }
    });
};


function getNewToken(oAuth2Client, callback, res_new_token) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client, res_new_token);
        });
    });
}


function authorize(credentials, callback, res_authorize) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback, res_authorize);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, res_authorize);
    });
};

function sendEmail(auth, res_sendEmail) {
    const gmail = google.gmail({ version: 'v1', auth })
    gmail.users.getProfile({
        userId: 'me'
    }, (err, { data }) => {
        if (err) return console.log('The API returned an error: ' + err)
        console.log(data.emailAddress);
        var userEmail = data.emailAddress;
        var raw = makeBody(toEmail, userEmail, subjectEmail, bodyEmail);
        gmail.users.messages.send({
            auth: auth,
            userId: 'me',
            resource: {
                raw: raw
            }
        }, function (err, response) {
            if (err) return console.log('The API returned an error: ' + err)
            res_sendEmail.status(200).JSON({
                fulfillmentMessages: [
                    {
                        text: {
                            text: [
                                "response " + response
                            ]
                        }
                    }
                ]
            })
        });

    });
}

function makeBody(to, from, subject, message) {
    var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');

    var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
    return encodedMail;
}
module.exports = router;