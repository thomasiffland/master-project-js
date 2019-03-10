FROM node:11
WORKDIR .
COPY package*.json ./
RUN apt-get update
RUN apt-get install imagemagick -y
RUN npm ci --only=production
COPY . .
CMD [ "npm", "start" ]