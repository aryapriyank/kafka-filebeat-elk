FROM node:22-alpine

WORKDIR /app

COPY package*.json .
RUN npm install

COPY microservice.js .

CMD ["node", "microservice.js"]