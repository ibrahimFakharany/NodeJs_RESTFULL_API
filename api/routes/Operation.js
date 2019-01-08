
const { googleAction } = require('actions-on-google');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const SCOPES = ['https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.insert',
    'https://www.googleapis.com/auth/gmail.send'];


const TOKEN_PATH = 'token.json';
class Operation {

    constructor(serverResponse, agent) {
        this.serverResponse = serverResponse;
        this.agent = agent;
    }

    getNewToken(oAuth2Client) {

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            return oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                return oAuth2Client;
            });
        });
    }

    authorizeUser() {
        return fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Gmail API.
            return  authorize(JSON.parse(content));
           
        });
    }
    authorize(credentials) {
        
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        return fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getNewToken(oAuth2Client, callback, res_authorize);
            oAuth2Client.setCredentials(JSON.parse(token));
            // callback(oAuth2Client, res_authorize);
            return oAuth2Client;
        });
    };


    sendEmail(auth) {
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
                serverResponse.status(200).json({
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

}
module.exports = Operation;