
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


    async  getNewToken(oAuth2Client) {

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        let codePromise = new Promise((resolve, reject) => {
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                resolve(code);
            });
        });
        let code = await codePromise;

        let tokenPromise = new Promise((resolve, reject) => {
            oAuth2Client.getToken(code, async (err, token) => {

                if (err) reject('Error retrieving access token');
                else {
                    oAuth2Client.setCredentials(token);
                    // Store the token to disk for later program executions
                    resolve(token);
                }
            });
        });
        let token = await tokenPromise;
        let authPromise = new Promise((resolve, reject) => {
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) reject(error);
                else {
                    console.log('Token stored to', TOKEN_PATH);
                    resolve(oAuth2Client);
                }
            });
        });
        let auth = await authPromise;
        return auth;
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
            fs.readFile(TOKEN_PATH, async (err, token) => {
                if (err) return resolve(await this.getNewToken(oAuth2Client));
                oAuth2Client.setCredentials(JSON.parse(token));
                console.log('authentication in authorize method in callback ---> ' + typeof oAuth2Client);
                resolve(oAuth2Client);
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
    sendEmail(auth, toEmail, subjectEmail, bodyEmail) {
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