# Herow SDK Backend

[HSB is the SDK backside](https://github.com/herowio/herow-sdk-backend) helping us to save the world.

It includes several api to interact with [SDK iOS](https://github.com/herowio/herow-sdk-ios) and [SDK Android](https://github.com/herowio/herow-sdk-android).

![let's go save the world](https://media.giphy.com/media/26BRxBeok96wnAwpy/source.gif)

## How to test it?

`node` is also needed, we use `v15.14.0` but should work with lower version.

```
$> brew install node
```

After that, install dependencies and run tests

```
$> npm install
$> npm test
```

## How to dev it?

`docker-compose` sets up Redis and Kafka.

Under MacOs, please update `KAFKA_ADVERTISED_HOST_NAME` with your local IP. _(localhost should work under Linux)_

```
$> docker-compose up
```

and…

```
$> npm start
```

Inject the only one needed data

```
$> docker-compose exec redis redis-cli
127.0.0.1:6379> SET d52066c26e3803659e5d1a4b75cdbaab2b26474f371eb17c7e582be67fdca0df client
OK
```

This key allows you to communicate with the api by using SDK side :

- client_id: test
- client_secret: test
- username: test
- password: test

# Redis interactions

We massively use Redis as database.
It contains dedicated keys as you can see above.

## identity key

This key allows to match an SDK instance to a `client`. You can create any client as needed, a dedicated key for SDK Android and SDK iOS, etc.

This part ensure that an untrusted SDK can not interact with your backend.

We need 4+1 informations :

| key | description | example |
| --- | ----------- | ------- |
| client_id | a human readable key | my-dedicated-sdk-on-android |
| client_secret | a secret given to a trusted sdk | 54trtk4zEr@ |
| username | a dedicated account allowing to use the app | appdemo |
| password | a dedicated password | rtFGHG6$ |

The 5th element is a salt used to hash those informations:

`sha256(SALT, client_id@client_secret@username@password)`

`TOKEN_SALT` envars is used to override salt key.

The generated key is stored on redis and value is an arbitrary client's name.

## token key

Every time an SDK generates a token, it is stored with key `token:<token>` and associated with `client`'s name (see above)

## device key

The SDK configuration _(IDFA, customId, optin)_ is stored on key `device:<deviceId>` during `USER_INFO_EXPIRATION` or 30 days.

## last-modified-cache key

The SDK regularly pulls its configuration.
When cache seems oudated, we can use the key `last-modified-cache:<client>` to order a cache refresh.

`last-modified-cache:<client>` contains timestamp in milliseconds of the last cache update. SDK will decide if it have to refresh it.

## campaigns key

`campaigns:<client>` contains an array of campaigns associated to a given client. If this key is modified, we also should upgrade `last-modified-cache:<client>`.

## zones key

`zones:<client>:<geohash>` contains an array of "zones" dedicated to a client and to a specific area. [Geohash](https://fr.wikipedia.org/wiki/Geohash) is a 4 digits geocoding code used to parcel the world on 20kmx20km squares. If this key is modified, we also should upgrade `last-modified-cache:<client>`.

## pois key

`pois:<geohash>` contains a array of "pois" for a given area. Content is shared with every client.

# API details

![you're my god damn hero](https://media.giphy.com/media/Sv0uzXvg8svM4/source.gif)

## Retrieving an access_token

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

## Sending user informations

```
▶ http PUT http://localhost:8080/v2/sdk/userinfo x-device-id:test x-sdk:test x-version:7.0 "Authorization: OAuth test" < userinfo.json
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

## Getting configuration

```
▶ http GET http://localhost:8080/v2/sdk/config x-device-id:test x-herow-id:test x-sdk:test x-version:7.0 "Authorization: OAuth test"
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

## Getting cache

```
▶ http GET http://localhost:8080/v2/sdk/cache/content/test x-device-id:test x-herow-id:test x-sdk:test x-version:7.0 "Authorization: OAuth test"
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

## Pushing LOG

```
▶ http POST http://localhost:8080/stat/queue x-device-id:test x-herow-id:test x-sdk:test x-version:7.0 "Authorization: OAuth test" < log_context.json
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 0
Date: Sat, 23 Jan 2021 13:26:41 GMT
Keep-Alive: timeout=5
X-Powered-By: Express
X-Ref-Date: Sat, 23 Jan 2021 13:26:41 GMT
```

## LOG format

### CONTEXT

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
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518"
    }
}
```

### CONTEXT_REALTIME

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
        "ua":"Mozilla/5.0 (iPhone12,1; CPU iPhone OS 14_3 like Mac OS X) FxiOS/3.3.0b518"
    }
}
```

### GEOFENCE_ENTER

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
        }
    }
}
```

### GEOFENCE_EXIT

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
        }
    }
}
```

### GEOFENCE_VISIT

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

### GEOFENCE_ZONE_NOTIFICATION

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
        "techno_hash": "1qnn4irqfmghs"
    }
}
```

### REDIRECT

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