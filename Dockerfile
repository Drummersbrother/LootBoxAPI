FROM mhart/alpine-node:latest
# FROM mhart/alpine-node:base-0.10
# FROM mhart/alpine-node

RUN apk add --no-cache wget

ENV DOCKERIZE_VERSION v0.2.0
RUN wget --no-check-certificate https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

RUN mkdir -p /app
WORKDIR /app

RUN npm i -g nodemon


COPY package.json /app/
RUN npm install

COPY . /app

#RUN chmod +x wait-for-it.sh
EXPOSE 9000


CMD ["nodemon", "app.js"]

