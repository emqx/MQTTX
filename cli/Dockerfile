FROM node:16

WORKDIR /app
COPY . ./

RUN yarn && yarn build && yarn link

CMD /bin/bash
