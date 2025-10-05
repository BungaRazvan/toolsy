FROM --platform=linux/arm64 node:20-bullseye


WORKDIR /usr/src/app

COPY . .

RUN npm install

