# nodejs 
FROM node:18
#directory
WORKDIR /usr/src/app
#copy depedencies
COPY package*.json ./
RUN npm install
# expose port
EXPOSE 8080
EXPOSE 1883
COPY . .
#running
CMD [ "node", "MQTTserver.js" ]