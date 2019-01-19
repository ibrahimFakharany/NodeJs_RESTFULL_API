const base64url = require('base64url');
const { googleAction } = require('actions-on-google');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const { google } = require('googleapis');
const ArrayList = require('arraylist');
const readline = require('readline');
const GoogleContacts = require("google-contacts-api");
const request = require('request');
const SCOPES = ['https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.insert',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.google.com/m8/feeds'];

const fs = require('fs');
const TOKEN_PATH = 'token.json';
class GmailOperations {

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

    getCredentials() {
        let promise = new Promise((resolve, reject) => {
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);

                // Authorize a client with credentials, then call the Gmail API
                resolve(content);
            });
        });
        return promise;

    }
    async authorizeUser() {
        let con = await this.getCredentials();
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
        const gmail = google.gmail({ version: 'v1', auth });
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
    async getMessages(auth, maxResult) {

        const gmail = google.gmail({ version: 'v1', auth });

        if (maxResult == -1) {

            let promiseGlobal = new Promise((resolveGlobal, reject) => {
                gmail.users.messages.list({
                    userId: 'me',
                    maxResults: 5
                }, (err, res) => {
                    resolveGlobal(res);
                });
            });

            let res = await promiseGlobal;
            let result = await this.gettingListSubjectFromMessageId(gmail, res);
            console.log(result);

            return {
                "success": 1,
                "result": result
            }

        } else if (maxResult > 0) {
            let result = await this.getMessagesWithLimit(gmail, maxResult)
            return {
                "success": 1,
                "result": result
            };

        } else {

            return {
                "success": 0,
                "message": "limit number cannot be less than or equal 0"
            }
        }

    }
    getGmailObjFromAuth(auth) {
        return google.gmail({ version: 'v1', auth });
    }
    async gettingListSubjectFromMessageId(response) {
        let list = new ArrayList;
        var complete = 0;
        let token = await this.getToken();
        let promise = new Promise((resolve, reject) => {
            console.log(response);
            response.data.messages.forEach(element => {
                var messageId = element.id;
                request('https://www.googleapis.com/gmail/v1/users/me/messages/' + messageId + '?access_token=' + token, { json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                    let stringResponse = JSON.stringify(res);
                    let jsonResponse = JSON.parse(stringResponse);
                    complete++;

                    for (var i = 0; i < jsonResponse.body.payload.headers.length; i++) {
                        if (jsonResponse.body.payload.headers[i].name == "Subject") {
                            var subject = jsonResponse.body.payload.headers[i].value;
                            if (subject === '') {
                                subject = "no subject";
                            }
                            list.add({ "id": messageId, "subject": subject });
                            break;
                        }
                    }
                    if (complete == response.data.messages.length) {
                        resolve(list);
                    }
                });

            });

        });

        let result = await promise;
        return result;
    }

    //TODO : MAKE NEW METHOD FOR GETTING MESSAGE ID FROM RESPOSNE

    async getMessagesWithLimit(gmail, limit) {

        let promise = new Promise((resolve, reject) => {
            gmail.users.messages.list({
                userId: 'me',
                maxResults: limit
            }, (err, res) => {
                let list = new ArrayList;
                res.data.messages.forEach(element => {
                    gmail.users.messages.get({
                        userId: 'me',
                        id: element.id
                    }, (err, response) => {
                        var bodyData = response.data.payload.body.data;
                        var str = this.decodeMessageBody(bodyData);
                        list.add(str);
                    });
                });
            });

        });
        let result = await promise;
        return result;
    }
    async getMessagesByDate(date) {
        let token = await this.getToken();
        let promise = new Promise((resolve, reject) => {
            request('https://www.googleapis.com/gmail/v1/users/me/messages?q=after:' + date + '&access_token=' + token, { json: true }, (err, res, body) => {
                if (err) { return console.log(err); }
                let stringResponse = JSON.stringify(res);
                let jsonResponse = JSON.parse(stringResponse);

                resolve(jsonResponse);
            });

        });
        let response = await promise;
        return response;
    }

    async getMessagesByDateInBetween(start, end) {
        let token = await this.getToken();
        let promise = new Promise((resolve, reject) => {
            request('https://www.googleapis.com/gmail/v1/users/me/messages?q=after:' + start + ' before:' + end + '&access_token=' + token, { json: true }, (err, res, body) => {
                if (err) { return console.log(err); }
                let stringResponse = JSON.stringify(res);
                let jsonResponse = JSON.parse(stringResponse);

                resolve(jsonResponse);
            });

        });
        let response = await promise;
        return response;


    }


    // getting messages by contact name 
    async getMessagesByContactName(state, contactName) {
        let token = await this.getToken();
        let link = null
        if (state == "by") {
            link = "https://www.googleapis.com/gmail/v1/users/me/messages?q=from:" + contactName + "&access_token=" + token;

        } else if (state == "to") {
            link = "https://www.googleapis.com/gmail/v1/users/me/messages?q=to:" + contactName + "&access_token=" + token;
        }

        let promise = new Promise((resolve, reject) => {
            request(link, { json: true }, (err, res, body) => {
                if (err) { return console.log(err); }
                let stringResponse = JSON.stringify(res);
                let jsonResponse = JSON.parse(stringResponse);

                resolve(jsonResponse);
            });

        });
        let response = await promise;
        return response;
    }

    decodeMessageBody(encodedBody) {
        return base64url.decode(encodedBody);
    }
    async getContacts(contactName) {
        let token = await this.getToken();

        let promise = new Promise((resolve, reject) => {
            request('https://www.google.com/m8/feeds/contacts/default/full?alt=json&q="' + contactName + '"&access_token=' + token, { json: true }, (err, res, body) => {
                if (err) { return console.log(err); }
                let stringResponse = JSON.stringify(res);
                let jsonResponse = JSON.parse(stringResponse);
                var index;
                var emailIndex;
                var emailList = new ArrayList;
                for (index in jsonResponse.body.feed.entry) {
                    for (emailIndex in jsonResponse.body.feed.entry[index].gd$email) {
                        console.log(jsonResponse.body.feed.entry[index].gd$email[emailIndex].address);
                        emailList.add(jsonResponse.body.feed.entry[index].gd$email[emailIndex].address);
                    }
                }
                resolve(emailList);
            });

        });

        let emailList = await promise;
        if (emailList.length > 1) {
            // show emails
            return { "sent": 1, "emails": emailList }
        } else if (emailList.length == 1) {
            // send email to that email
            return { "sent": 0, "email": emailList[0] };
        } else {
            // this name couldn't recognized
            return { "sent": -1, "message": "couldn't recognize this name " }
        }
    }

    async getBodyOfMessage(message){
        
    }
    async deleteContact(emailAddress) {
        let link = "https://www.google.com/m8/feeds/contacts/\'ibraheemelfakharany@gmail.com\'/full/\"http://www.google.com/m8/feeds/contacts/ibraheemelfakharany%40gmail.com/base/675fa7e18b28859c\'?access_token=ya29.GluTBkKph4xYXdvxuDM_QX8yEQCiqmrwZqmDA3ivcwdYC_DwszB71gJrYGHQEPtPsyHRWnQ1DtSR3-oHj4GDI2hgzqhY50Nc5hqeTMVzG6OLjSvTzEIgOJAWs5SB"
    }

    async getToken() {
        let con = await this.getCredentials();
        con = JSON.parse(con);
        const { client_secret, client_id, redirect_uris } = con.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        let promise = new Promise((resolve, reject) => {
            fs.readFile(TOKEN_PATH, async (err, token) => {
                if (err) { return resolve(await this.getNewToken(oAuth2Client)); }
                resolve(JSON.parse(token));
            });
        });
        let token = await promise;
        return token.access_token;
    }
}
module.exports = GmailOperations;