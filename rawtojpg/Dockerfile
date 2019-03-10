FROM node:11
WORKDIR .
COPY package*.json ./
RUN apt-get update
RUN apt-get install imagemagick -y
RUN apt-get install software-properties-common -y
RUN add-apt-repository ppa:dhor/myway
RUN apt-get install dcraw -y
RUN npm ci --only=production
COPY . .
CMD [ "npm", "start" ]