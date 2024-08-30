FROM node:18
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

EXPOSE 3000
COPY . .

CMD ["node","Httpserver.js"] 