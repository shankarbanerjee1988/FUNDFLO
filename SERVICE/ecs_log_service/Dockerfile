FROM node:18-alpine

LABEL maintainer 'shankar.banerjee@fundflo.ai (Fundflo Tech)'

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
#COPY package.json ./

COPY . /usr/src/app

RUN npm install --omit=dev
# Bundle app source


EXPOSE 8110
CMD ["node", "server.js"]
