
const { googleAction } = require('actions-on-google');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const { google } = require('googleapis');

const readline = require('readline');
const SCOPES = ['https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.insert',
    'https://www.googleapis.com/auth/gmail.send'];

const fs = require('fs');
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
                    if (err) console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                return oAuth2Client;
            });
        });
    }

    async authorizeUser() {


        let promise = new Promise((resolve, reject) => {
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);

                // Authorize a client with credentials, then call the Gmail API
                resolve(content);
                reject(new Error('error in authorizeUser'));
            });

        })
        let con = await promise;
   

        let auth = await this.authorize(JSON.parse(con));
        
        return auth;

    }

    async authorize(credentials) {

        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        return new Promise((resolve, reject) => {
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) return this.getNewToken(oAuth2Client);
                oAuth2Client.setCredentials(JSON.parse(token));
                // callback(oAuth2Client, res_authorize);
                console.log('authentication in authorize method in callback ---> ' + typeof oAuth2Client);
                resolve(oAuth2Client);
                reject(new Error('error in authorize'));
            });
        });
    };
   makeBody(to, from, subject, message) {
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
    sendEmail(auth,toEmail, subjectEmail, bodyEmail) {
        const gmail = google.gmail({ version: 'v1', auth })
        gmail.users.getProfile({
            userId: 'me'
        }, (err, data) => {
          
            if (err) return console.log('The API returned an error: ' + err)
            var userEmail = data.emailAddress;
            var raw = this.makeBody(toEmail, userEmail, subjectEmail, bodyEmail);
            gmail.users.messages.send({
                auth: auth,
                userId: 'me',
                resource: {
                    raw: raw
                }
            }, function (err, response) {
                if (err) return console.log('The API returned an error: ' + err)
            });

        });
        return new Promise((resolve, reject) => {
            resolve('sent');
        });
    }

}
module.exports = Operation;