FROM node:16-alpine

WORKDIR /app
COPY . ./

RUN yarn && yarn build && yarn link

CMD /bin/bash
