# nodejs 
FROM node:18
#directory
WORKDIR /usr/src/app
#copy depedencies
COPY package*.json ./
RUN npm install
# expose port
EXPOSE 3000
COPY . .
#running
CMD ["node","Httpserver.js"] 