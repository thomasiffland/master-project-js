FROM node:11
WORKDIR .
COPY package*.json ./
RUN apt-get update
RUN apt-get install libimage-exiftool-perl -y
RUN npm ci --only=production
COPY . .
CMD [ "npm", "start" ]