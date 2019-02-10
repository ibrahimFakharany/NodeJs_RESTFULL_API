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
class GmailAuth {
    constructor() {

    }

    // authroization
    async getNewToken() {
        let con = await this.getCredentials();
        con = JSON.parse(con);
        const { client_secret, client_id, redirect_uris } = con.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'online',
            scope: SCOPES,
        });
        return authUrl;
    }
    async getAuthObjectFromCode(code) {
        let con = await this.getCredentials();
        con = JSON.parse(con);
        const { client_secret, client_id, redirect_uris } = con.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
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

    async getAuthObject() {
        let con = await this.getCredentials();
        con = JSON.parse(con);
        const { client_secret, client_id, redirect_uris } = con.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        return oAuth2Client;
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
                let time = new Date().getTime();
                if (err || JSON.parse(token).expiry_date < time) return resolve(await this.getNewToken(oAuth2Client));
                oAuth2Client.setCredentials(JSON.parse(token));
                resolve(oAuth2Client);
            });
        });
    };

    getGmailObjFromAuth(auth) {
        return google.gmail({ version: 'v1', auth });
    }
    async getToken() {
        let promise = new Promise((resolve, reject) => {
            fs.readFile(TOKEN_PATH, async (err, token) => {
                let time = new Date().getTime();


                if (err || JSON.parse(token).expiry_date < time) {
                    resolve({
                        'status': 2,
                        'data': await this.getNewToken(),

                    })
                }
                else {
                    let jToken = JSON.parse(token);
                    resolve({
                        'status': 1,
                        'data': jToken.access_token
                    })


                }

            });
        });
        let result = await promise;
        return result;
    }

}

module.exports = GmailAuth;
