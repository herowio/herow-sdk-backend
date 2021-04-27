import json
import redis
import os

r = redis.Redis(host=os.environ['REDIS_URL'], port=6379, db=0)

with open('./data.json', 'r') as redis:
    data = redis.read()

dump = json.loads(data)

for e in dump:
    for k,v in e.items():
        print(k)
        if type(v) == str:
            r.set(k, v)
        else:
            r.set(k, json.dumps(v))