FROM library/node:15-alpine3.13
COPY routes /routes
COPY server.js /server.js
COPY app.js /app.js
COPY package.json /package.json
RUN npm install
EXPOSE 8080
ENTRYPOINT ["npm", "start"]
