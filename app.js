'use strict';
const util = require('util');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
    console.log('>>>>> ' + req.url + '\n- headers: ' + util.inspect(req.headers, false, null, true /* enable colors */) + ' \n- body: ' + util.inspect(req.body, false, null, true /* enable colors */) );
    next();
    console.log('<<<<< ' + 'status: ' + res.statusCode);
});

app.post('/auth/authorize/token', (req, res) => {

    // those fields are mandatory
    var client_id = req.body.client_id;
    var client_secret = req.body.client_secret;
    var grant_type = req.body.grant_type; // password
    var username = req.body.username;
    var password = req.body.password;

    if (client_id == null || client_secret == null) {
        return res.status(500).send("client_id and client_secret are mandatory.").end();
    }

    if (grant_type != "password") {
        return res.status(500).send("grant_type must set to password.").end();
    }

    if (username == null || password == null) {
        return res.status(500).send("username and password are mandatory.").end();
    }

    res.status(200).send({
        "accessToken": "15RUVomOGl",
        "expiresIn": 3600,
        "refreshToken": "hvGoXOZKNs"
    }).end();
});

app.post("/stat/queue", (req, res) => {
    if (req.get("Authorization") == null) {
        return res.status(401).send("Authentization OAuth <accessToken> is mandatory.").end();
    }

    if (req.get("x-device-id") == null) {
        return res.status(500).send("x-device-id header is mandatory.").end();
    }

    if (req.get("x-herow-id") == null) {
        return res.status(500).send("x-herow-id header is mandatory.").end();
    }

    if (req.get("x-sdk") == null) {
        return res.status(500).send("x-sdk header is mandatory.").end();
    }

    if (req.body.t != "app_mobile") {
        return res.status(400).send("t have to be set to app_mobile.").end();
    }

    if (!req.body.data) {
        return res.status(400).send("payload have to contain data object field.").end();
    }

    res.status(200).set('X-Ref-Date', new Date().toUTCString()).send().end();
});

app.put("/v2/sdk/userinfo", (req, res) => {

    var adId = req.body.adId;
    var optins = req.body.optins;

    if (adId != null && (adId.length < 10 || adId.length > 500)) {
        return res.status(500).send("if adId is provided, it must constain 10 to 500 characters.").end();
    } 

    if (optins == null || optins.length != 1) {
        return res.status(500).send("optins must contain only 1 optin").end();
    }

    if (optins[0].type != "USER_DATA") {
        return res.status(500).send("optins must be a USER_DATA: true/false").end();
    }

    if (req.get("Authorization") == null) {
        return res.status(401).send("Authentization OAuth <accessToken> is mandatory.").end();
    }

    if (req.get("x-device-id") == null) {
        return res.status(500).send("x-device-id header is mandatory.").end();
    }

    if (req.get("x-sdk") == null) {
        return res.status(500).send("x-sdk header is mandatory.").end();
    }

    res.status(200).send({
        "herowId": (req.get("x-herow-id") != null) ? req.get("x-herow-id") : "rtegflkgt",
        "modifiedDate": new Date().getTime()
    }).end();
});

app.get("/v2/sdk/cache/content/:geohash", (req, res) => {
    var geohash = req.params.geohash;

    if (req.get("Authorization") == null) {
        return res.status(401).send("Authentization OAuth <accessToken> is mandatory.").end();
    }

    if (geohash.length != 4) {
        return res.status(500).send("geohash have to be set with 4 characters.").end();
    }

    if (req.get("x-device-id") == null) {
        return res.status(500).send("x-device-id header is mandatory.").end();
    }

    if (req.get("x-herow-id") == null) {
        return res.status(500).send("x-herow-id header is mandatory.").end();
    }

    if (req.get("x-sdk") == null) {
        return res.status(500).send("x-sdk header is mandatory.").end();
    }

    res.status(200).send({
        "campaigns": [
            {
                "begin": 1611187200000,
                "company": "mycompany",
                "createdDate": 1611267964009,
                "deleted": false,
                "id": "6009ff7c89bfa239ecce712e",
                "intervals": [
                    {
                        "end": 1611440772431,
                        "start": 1611267972431
                    }
                ],
                "modifiedDate": 1611267964683,
                "name": "test",
                "notification": {
                    "description": "welcome at herow.io",
                    "title": "Have a good day"
                },
                "recurrenceEnabled": false,
                "simpleId": "6009ff7c89bfa239ecce712e",
                "triggers": {
                    "dwellTime": 0,
                    "isPersistent": 1,
                    "onExit": 0
                },
                "tz": "Europe/Paris"
            }
        ],
        "pois": [
            {
                "id": "7515771363",
                "lat": 48.84748,
                "lng": 2.35231,
                "tags": [
                    "frfastfood"
                ]
            },
            {
                "id": "7507039985",
                "lat": 48.82764,
                "lng": 2.32898,
                "tags": [
                    "frfastfood"
                ]
            },
            {
                "id": "7496768686",
                "lat": 48.8334,
                "lng": 2.32431,
                "tags": [
                    "frfastfood"
                ]
            }
        ],
        "zones": [
            {
                "access": {
                    "address": "54 Rue de Paradis, 75010 Paris, France",
                    "id": "6004957256eb6779115b6d8a",
                    "name": "HEROW"
                },
                "campaigns": ["6009ff7c89bfa239ecce712e"],
                "hash": "ivbxbhxm8rnk",
                "lat": 48.875741,
                "liveEvent": true,
                "lng": 2.349255,
                "radius": 300
            }
        ]
    }).end();

});

app.get("/v2/sdk/config", (req, res) => {
    if (req.get("Authorization") == null) {
        return res.status(401).send("Authentization OAuth <accessToken> is mandatory.").end();
    }

    if (req.get("x-device-id") == null) {
        return res.status(500).send("x-device-id header is mandatory.").end();
    }

    if (req.get("x-herow-id") == null) {
        return res.status(500).send("x-herow-id header is mandatory.").end();
    }

    if (req.get("x-sdk") == null) {
        return res.status(500).send("x-sdk header is mandatory.").end();
    }

    var now = new Date();
    res.status(200).set({
        'X-Ref-Date': now.toUTCString(),
        'X-Cache-Last-Modified': new Date(now.getTime() - 5 * 60 * 1000).toUTCString(), // cache is outdated
        'Last-Modified': new Date(now.getTime() - 60 * 60 * 1000).toUTCString(),
    }).send({
        "cacheInterval": 10800000,
        "configInterval": 600000,
        "enabled": true
    }).end();
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`HEROW Backend listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;