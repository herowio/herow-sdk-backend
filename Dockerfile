FROM library/node:13-alpine
COPY app.js /app.js
COPY package.json /package.json
RUN npm install
EXPOSE 8080
ENTRYPOINT ["npm", "start"]