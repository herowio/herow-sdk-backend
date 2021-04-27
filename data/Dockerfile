FROM python:3.9
RUN pip install redis
COPY bootstrap-redis.py /bootstrap-redis.py
COPY data.json /data.json
CMD [ "python", "/bootstrap-redis.py" ]