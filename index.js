require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const moment = require('moment');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = `${process.argv[1]}/token.json`;


const action = process.argv[2];
switch(action) {
    case 'in':
        call(punchIn);
        break;
    case 'out':
        call(punchOut);
        break;
    case 'status':
        call(status);
        break;
    default:
        console.log('Command not recognized.');
        return false;
}

// Load client secrets from a local file.
function call(arg) {
    fs.readFile(`${process.argv[1]}/credentials.json`, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), arg);
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
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
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}


function punchIn(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    const now = new Date().toUTCString();

    sheets.spreadsheets.values.get({
        spreadsheetId: '102DXuwxiH3ZhqgkXw2FxfltycuDnugg7hYdb8rfIRHI',
        range: 'Hours!A4:B'
    }, (err, result) => {
        if(err) return console.log('The API returned an error: ' + err);
        
        const rows = result.data.values;
        const firstEntryIndex = 4;
        const ins = rows ? rows.map(row => row[0]).filter(t => t) : [];
        const outs = rows ? rows.map(row => row[1]).filter(t => t) : [];

        if(ins.length === outs.length) {
            sheets.spreadsheets.values.update({
                spreadsheetId: '102DXuwxiH3ZhqgkXw2FxfltycuDnugg7hYdb8rfIRHI',
                range: `Hours!A${firstEntryIndex + ins.length}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [
                        [now]
                    ]
                }
            }, (err, result) => {
                if(err) return console.log('The API returned an error: ' + err);
        
                console.log(`☕ ${now}`);
            });
        } else {
            return console.log('You are already punched in.');
        }
    });
}

function punchOut(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    const now = new Date().toUTCString();

    sheets.spreadsheets.values.get({
        spreadsheetId: '102DXuwxiH3ZhqgkXw2FxfltycuDnugg7hYdb8rfIRHI',
        range: 'Hours!A4:B'
    }, (err, result) => {
        if(err) return console.log('The API returned an error: ' + err);
        
        const rows = result.data.values;
        const firstEntryIndex = 4;
        const ins = rows ? rows.map(row => row[0]).filter(t => t) : [];
        const outs = rows ? rows.map(row => row[1]).filter(t => t) : [];
        if(ins.length === outs.length) {
            return console.log('You are already punched out.');
        } else {
            sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: `Hours!B${firstEntryIndex + outs.length}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [
                        [now]
                    ]
                }
            }, (err, result) => {
                if(err) return console.log('The API returned an error: ' + err);
        
                console.log(`😴 ${now}`);
            });
        }
    });
}

function status(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    const now = new Date().toUTCString();

    sheets.spreadsheets.values.batchGet({
        spreadsheetId: '102DXuwxiH3ZhqgkXw2FxfltycuDnugg7hYdb8rfIRHI',
        ranges: ['Hours!A4:B', 'Hours!F2']
    }, (err, result) => {
        if(err) return console.log('The API returned an error: ' + err);
        
        const ranges = result.data.valueRanges;
        const status = ranges[0].values;
        const totalHours = ranges[1].values;
        if(totalHours) console.log(`${totalHours[0][0]} total hours worked.`)
        if(status[status.length - 1].length === 1) {
            const punchInTime = status[status.length - 1][0];
            console.log(`You've been punched in since ${moment(punchInTime, moment.RFC_2822).fromNow()}.`);
        } else {
            const punchOutTime = status[status.length - 1][1];
            console.log(`You've been punched out since ${moment(punchOutTime, moment.RFC_2822).fromNow()}.`)
        }
    });
}