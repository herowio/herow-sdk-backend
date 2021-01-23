# Herow SDK Test Backend

## What is it?

This is a dummy server implementation for the HEROW SDK.

It help developers to test locally by providing a mocked API :) 

![test](https://media.giphy.com/media/l46Cbqvg6gxGvh2PS/giphy.gif)

## How to run it?

```
$> npm install
$> npm start
```

## We provide several API

### Retrieving an access_token

```
▶ http POST http://localhost:8080/auth/authorize/token\?client_id\=test\&client_secret\=test\&grant_type\=password\&username\=test\&password\=test
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 73
Content-Type: application/json; charset=utf-8
Date: Sat, 23 Jan 2021 13:21:56 GMT
ETag: W/"49-wpXwlMWOi1/8xHBR13WxQhdfC2g"
Keep-Alive: timeout=5
X-Powered-By: Express

{
    "accessToken": "15RUVomOGl",
    "expiresIn": 3600,
    "refreshToken": "hvGoXOZKNs"
}
```

### Sending user informations

```
▶ http PUT http://localhost:8080/v2/sdk/userinfo x-device-id:test x-sdk:test "Authorization: OAuth test" < userinfo.json
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 65
Content-Type: application/json; charset=utf-8
Date: Sat, 23 Jan 2021 13:24:44 GMT
ETag: W/"41-g2MG4pP/TrmEWL2e0KqmbvgORJA"
Keep-Alive: timeout=5
X-Powered-By: Express

{
    "herowId": "rtegflkgt",
    "modifiedDate": "2021-01-23T13:24:44.795Z"
}
```

### Getting configuration

```
▶ http GET http://localhost:8080/v2/sdk/config x-device-id:test x-herow-id:test x-sdk:test "Authorization: OAuth test"
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 65
Content-Type: application/json; charset=utf-8
Date: Sat, 23 Jan 2021 13:25:32 GMT
ETag: W/"41-kz/JABlDaPECC72hYEPSys6Rcd8"
Keep-Alive: timeout=5
Last-Modified: Sat Jan 23 2021 13:25:32 GMT+0100 (Central European Standard Time)
X-Cache-Last-Modified: Sat Jan 23 2021 14:20:32 GMT+0100 (Central European Standard Time)
X-Powered-By: Express
X-Ref-Date: Sat, 23 Jan 2021 13:25:32 GMT

{
    "cacheInterval": 10800000,
    "configInterval": 600000,
    "enabled": true
}
```

### Getting cache

```
▶ http GET http://localhost:8080/v2/sdk/cache/content/test x-device-id:test x-herow-id:test x-sdk:test "Authorization: OAuth test"
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 896
Content-Type: application/json; charset=utf-8
Date: Sat, 23 Jan 2021 13:26:07 GMT
ETag: W/"380-7HN1VQCNcY9s+bCD6V3XtFWykTw"
Keep-Alive: timeout=5
X-Powered-By: Express

{
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
            "campaigns": [],
            "hash": "ivbxbhxm8rnk",
            "lat": 48.875741,
            "liveEvent": true,
            "lng": 2.349255,
            "radius": 300
        }
    ]
}
```

### Pushing LOG

```
▶ http POST http://localhost:8080/stat/queue/multi x-device-id:test x-herow-id:test x-sdk:test "Authorization: OAuth test"
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 0
Date: Sat, 23 Jan 2021 13:26:41 GMT
Keep-Alive: timeout=5
X-Powered-By: Express
X-Ref-Date: Sat, 23 Jan 2021 13:26:41 GMT
```