FROM node:18-alpine

WORKDIR /studio

COPY . ./

RUN npm i

RUN npm run build

CMD ["npm","start"]