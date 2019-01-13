
var GoogleContacts = require('./index');
var assert = require('assert');
var token;

function test(token, cb) {
    var contacts = new GoogleContacts({ token : token });
    contacts.getContacts(cb);
}

// test proper failure on invalid access
test(token, function(err, contacts) {
    assert(typeof err !== "undefined", "err should not be undefined");
});

// test proper success on valid access
token = process.env.GOOGLE_API_TOKEN;

if (!token) {
    console.log("$GOOGLE_API_TOKEN must be set");
    process.exit(1);
}

test(token, function(err, contacts) {
    assert(!err, "err should falsey");
    assert(typeof contacts !== "undefined", "contacts should be defined");
    assert(!!contacts.length, "more than one contact should be returned");
});
