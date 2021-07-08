# Herow SDK Backend

## Table of contents

* [General info](#general-info)
* [Technologies](#technologies)
* [Setup](#setup)

## General info

[This project is the HEROW's SDK backside API](https://github.com/herowio/herow-sdk-backend).

It includes API needed to interact with [SDK iOS](https://github.com/herowio/herow-sdk-ios) and [SDK Android](https://github.com/herowio/herow-sdk-android).

You can deploy it on AppEngine, Heroku, Kubernetes or on premise.

## Technologies

Project is created with:

- Node _(v15.14.0 - but should work with lower version)_
- Redis 1+
- Kafka 0.10+

## Setup

```
$> brew install node
```

Clone the project

```
$> git clone git@github.com:herowio/herow-sdk-backend.git
$> cd herow-sdk-backend
```

Deploy Redis and Kafka via docker

```
$> docker-compose up # for x86
$> docker-compose -f docker-compose.yml.arm64 up # for M1
```

After that, install dependencies and run it 

```
$> npm install
$> npm start
```

### Redis interactions

We massively use Redis as database. You have to set a `REDIS_URL` env var to interact with. _(default value: redis://127.0.0.1)_

#### Identity key

This key allows to match an SDK instance to a `client`. You can create any client as needed. **You should create a dedicated key for SDK Android and SDK iOS by client and by version**. By this way, you could "stop" easily a specific sdk for a given client.

This part ensure that an untrusted SDK can not interact with your backend.

We need 4+1 informations :

| key | description | example |
| --- | ----------- | ------- |
| client_id | a human readable key | my-dedicated-sdk-on-android |
| client_secret | a secret given to a trusted sdk | 54trtk4zEr@ |
| username | a dedicated account allowing to use the app | appdemo |
| password | a dedicated password | rtFGHG6$ |


The 5th element is a salt used to hash those informations:

![](https://media.giphy.com/media/l0EoBVexxvaP88SSQ/giphy.gif)

`sha256(TOKEN_SALT, client_id@client_secret@username@password)`

`TOKEN_SALT` env var is used to override salt key _(default is set to secret)_.

The generated key is stored on redis and value is an arbitrary client's identifier.

To generate a new one :

```
▶ node
Welcome to Node.js v16.0.0.
Type ".help" for more information.
> const crypto = require('crypto')
undefined
> crypto.createHmac("sha256", "secret").update("test@test@test@test").digest("hex")
'd52066c26e3803659e5d1a4b75cdbaab2b26474f371eb17c7e582be67fdca0df'
```

#### Token key

After successful authentification, `token` is stored by using key `token:<token>` and associated with the `client`'s identifier _(see above)_. This key is storing during `TOKEN_EXPIRATION` env var _(default is set to 10800 seconds -> 3 hours)_.

#### Device key

The SDK configuration _(IDFA, customId, optin)_ is stored on key `device:<deviceId>` during `USER_INFO_EXPIRATION` env var _(default is set to 2592000 seconds -> 30 days)_.

SDK updates those information every day. Meaning that a quiet user is forgotten after 30 days, to prevent privacy.

#### last-modified-cache key

The SDK regularly pulls its configuration.
When cache seems outdated, we use the key `last-modified-cache:<client>` to order a cache refresh.

`last-modified-cache:<client>` contains timestamp in milliseconds of the last cache update. SDK will decide if it have to refresh it.

#### Campaigns key

`campaigns:<client>` contains an array of campaigns associated to a given client. If this key is modified, we also should upgrade `last-modified-cache:<client>`.

#### Zones key

`zones:<client>:<geohash>` contains an array of "zones" dedicated to a client and to a specific area. [Geohash](https://fr.wikipedia.org/wiki/Geohash) is a 4 digits geocoding code used to parcel the world on 20x20 km squares. If this key is modified, we also should upgrade `last-modified-cache:<client>`.

#### Pois key

`pois:<geohash>` contains a array of "pois" for a given area. Content is shared with every client.

### Kafka interaction

We use Kafka to collect and dispatch LOG from SDKs. You can set `KAFKA_URL` to interact with _(default is set to 127.0.0.1:9092)_. For now, `KAFKA_URL` is a string list of host:port separated by a comma. _(host1:9092,host2:9092,host3:9092)_. *TLS keys and certificates or SASL and are not supported.*

LOG are published on `KAFKA_TOPIC` env var topic _(default is set to stat-logs)_. We use `deviceId` as key and the content of LOG as message.

### API interaction

![you're my god damn hero](https://media.giphy.com/media/Sv0uzXvg8svM4/source.gif)

#### Retrieving an accessToken

```
▶ http POST http://localhost:8080/auth/authorize/token clientId=test clientSecret=test grantType=password username=test password=test x-version:7.0 x-sdk:test
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
    "expiresIn": 3600
}
```

`export ACCESS_TOKEN=$(http POST http://localhost:8080/auth/authorize/token clientId=test clientSecret=test grantType=password username=test password=test x-version:7.0 x-sdk:test | jq -r .accessToken)`

#### Sending user informations

```
▶ http PUT http://localhost:8080/v2/sdk/userinfo x-device-id:test x-sdk:test x-version:7.0 "Authorization: OAuth ${ACCESS_TOKEN}" < userinfo.json
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 52
Content-Type: application/json; charset=utf-8
Date: Fri, 12 Feb 2021 16:06:47 GMT
ETag: W/"34-IWUMkqB36H/NZo2fOjKEkVTz4hE"
Keep-Alive: timeout=5
X-Powered-By: Express

{
    "herowId": "rtegflkgt"
}
```

#### Getting configuration

```
▶ http GET http://localhost:8080/v2/sdk/config x-device-id:test x-herow-id:test x-sdk:test x-version:7.0 "Authorization: OAuth ${ACCESS_TOKEN}"
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

#### Getting cache

```
▶ http GET http://localhost:8080/v2/sdk/cache/content/u09t x-device-id:test x-herow-id:test x-sdk:test x-version:7.0 "Authorization: OAuth ${ACCESS_TOKEN}"
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
            "id": "6012bae71b0c357454994f28",
            "name": "HOME",
            "begin": 1611792000000,
            "end": 1619161212248,
            "capping": {
                "maxNumberNotifications": 3,
                "minTimeBetweenTwoNotifications": 3600000
            },
            "daysRecurrence": [
                "monday",
                "wednesday",
                "friday",
                "saturday"
            ],
            "startHour": "09:00",
            "stopHour": "19:45",
            "notification": {
                "title": "welcome home",
                "description": "bon retour à la maison!",
                "uri": "https://herow.io"
            }
        }
    ],
    "pois": [
        {
            "id": "7515771363",
            "lat": 48.84748,
            "lng": 2.35231,
            "tags": [
                "fastfood"
            ]
        }
    ],
    "zones": [
        {
            "access": {
                "address": "54 Rue de Paradis, 75010 Paris, France",
                "name": "HEROW"
            },
            "campaigns": ["6009ff7c89bfa239ecce712e"],
            "hash": "ivbxbhxm8rnk",
            "lat": 48.875741,
            "lng": 2.349255,
            "radius": 300
        }
    ]
}
```

#### Pushing LOG

```
▶ http POST http://localhost:8080/stat/queue x-device-id:test x-herow-id:test x-sdk:test x-version:7.0 "Authorization: OAuth ${ACCESS_TOKEN}" < log_context.json
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 0
Date: Sat, 23 Jan 2021 13:26:41 GMT
Keep-Alive: timeout=5
X-Powered-By: Express
X-Ref-Date: Sat, 23 Jan 2021 13:26:41 GMT
```

### LOG format

#### CONTEXT

Generated every time a new location is detected

```
{
    "t": "app_mobile",
    "data": {
        "phone_id":"98861604-512E-4958-8355-8E4EAFDD183D",
        "app_state":"bg",
        "lastLocation": {
            "speed":1.878,
            "horizontalAccuracy":29.0,
            "lng":3.8957527742527014,
            "lat":49.371630160712314,
            "timestamp":1611664821655
        },
        "lib_version":"7.0.0",
        "date":1611664821655,
        "nearbyPois":
        [
            {
                "id":"2000480482",
                "distance":522.2006007033652,
                "tags":["frsupermarket"]
            }
        ],
        "nearby_places":
        [
            {
                "lng":3.8958851696425416,
                "lat":49.371328458888385,
                "place_id":"1qnn4irqfmghs",
                "distance":34.90530795095254,
                "radius":300.0
            }
        ],
        "application_name":"herow",
        "application_version":"3.3.0",
        "subtype":"CONTEXT",
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518",
        "moments": {
            "home": 0.56,
            "office": 0.03,
            "shopping": 0.02,
            "other": 0.23
        }
    }
}
```

#### CONTEXT_REALTIME

Generated when "tracking mode" is enabled

```
{
    "t": "app_mobile",
    "data": {
        "phone_id":"98861604-512E-4958-8355-8E4EAFDD183D",
        "app_state":"bg",
        "lastLocation": {
            "speed":1.878,
            "horizontalAccuracy":29.0,
            "lng":3.8957527742527014,
            "lat":49.371630160712314,
            "timestamp":1611664821655
        },
        "lib_version":"7.0.0",
        "date":1611664821655,
        "nearbyPois":
        [
            {
                "id":"2000480482",
                "distance":522.2006007033652,
                "tags":["frsupermarket"]
            }
        ],
        "nearby_places":
        [
            {
                "lng":3.8958851696425416,
                "lat":49.371328458888385,
                "place_id":"1qnn4irqfmghs",
                "distance":34.90530795095254,
                "radius":300.0
            }
        ],
        "application_name":"herow",
        "application_version":"3.3.0",
        "subtype":"CONTEXT_REALTIME",
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518",
        "moments": {
            "home": 0.56,
            "office": 0.03,
            "shopping": 0.02,
            "other": 0.23
        }
    }
}
```

#### GEOFENCE_ENTER

Sent when a entering zone is detected.

```
{
    "t": "app_mobile",
    "data": {
        "phone_id":"98861604-512E-4958-8355-8E4EAFDD183D",
        "app_state":"bg",
        "lastLocation": {
            "speed":1.878,
            "horizontalAccuracy":29.0,
            "lng":3.8957527742527014,
            "lat":49.371630160712314,
            "timestamp":1611664821655
        },
        "lib_version":"7.0.0",
        "date":1611664821655,
        "application_name":"herow",
        "application_version":"3.3.0",
        "subtype":"GEOFENCE_ENTER",
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518",
        "place": {
                "lng":3.8958851696425416,
                "lat":49.371328458888385,
                "place_id":"1qnn4irqfmghs",
                "distance":34.90530795095254,
                "radius":300.0,
                "confidence":0.456
        },
        "moments": {
            "home": 0.56,
            "office": 0.03,
            "shopping": 0.02,
            "other": 0.23
        }
    }
}
```

#### GEOFENCE_EXIT

Sent when a exiting zone is detected.

```
{
    "t": "app_mobile",
    "data": {
        "phone_id":"98861604-512E-4958-8355-8E4EAFDD183D",
        "app_state":"bg",
        "lastLocation": {
            "speed":1.878,
            "horizontalAccuracy":29.0,
            "lng":3.8957527742527014,
            "lat":49.371630160712314,
            "timestamp":1611664821655
        },
        "lib_version":"7.0.0",
        "date":1611664821655,
        "application_name":"herow",
        "application_version":"3.3.0",
        "subtype":"GEOFENCE_EXIT",
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518",
        "place": {
                "lng":3.8958851696425416,
                "lat":49.371328458888385,
                "place_id":"1qnn4irqfmghs",
                "distance":34.90530795095254,
                "radius":300.0,
                "confidence":0.456
        },
        "moments": {
            "home": 0.56,
            "office": 0.03,
            "shopping": 0.02,
            "other": 0.23
        }
    }
}
```

#### GEOFENCE_VISIT

Sent when a exiting zone is detected.

`duration` is in milliseconds.
This duration is a calculated time between the GEOFENCE_ENTER and GEOFENCE_EXIT events.

```
{
    "t": "app_mobile",
    "data": {
        "phone_id":"98861604-512E-4958-8355-8E4EAFDD183D",
        "app_state":"bg",
        "lastLocation": {
            "speed":1.878,
            "horizontalAccuracy":29.0,
            "lng":3.8957527742527014,
            "lat":49.371630160712314,
            "timestamp":1611664821655
        },
        "lib_version":"7.0.0",
        "date":1611664821655,
        "application_name":"herow",
        "application_version":"3.3.0",
        "subtype":"GEOFENCE_VISIT",
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518",
        "place_id": "1qnn4irqfmghs",
        "duration": 1000
    }
}
```

#### GEOFENCE_ZONE_NOTIFICATION

Sent when a notification is displayed.

```
{
    "t": "app_mobile",
    "data": {
        "phone_id":"98861604-512E-4958-8355-8E4EAFDD183D",
        "app_state":"bg",
        "lastLocation": {
            "speed":1.878,
            "horizontalAccuracy":29.0,
            "lng":3.8957527742527014,
            "lat":49.371630160712314,
            "timestamp":1611664821655
        },
        "lib_version":"7.1.0",
        "date":1611664821655,
        "application_name":"herow",
        "application_version":"3.3.0",
        "subtype":"GEOFENCE_ZONE_NOTIFICATION",
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518",
        "place": {
                "lng":3.8958851696425416,
                "lat":49.371328458888385,
                "place_id":"1qnn4irqfmghs",
                "distance":634.90530795095254,
                "radius":300.0,
                "confidence":0.456
        },
        "campaign_id": "6009ff7c89bfa239ecce712e",
        "techno_hash": "1qnn4irqfmghs",
        "moments": {
            "home": 0.56,
            "office": 0.03,
            "shopping": 0.02,
            "other": 0.23
        }
    }
}
```

#### REDIRECT

Sent when a notification is opened _(click on it)_.

```
{
    "t": "app_mobile",
    "data": {
        "phone_id":"98861604-512E-4958-8355-8E4EAFDD183D",
        "app_state":"bg",
        "lib_version":"7.1.0",
        "date":1611664821655,
        "application_name":"herow",
        "application_version":"3.3.0",
        "subtype":"REDIRECT",
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518",
        "campaign_id": "6009ff7c89bfa239ecce712e",
        "techno_hash": "1qnn4irqfmghs"
    }
}
```
