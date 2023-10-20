FROM node:16-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --frozen-lockfile

COPY . ./

RUN yarn build

FROM node:16-alpine AS runtime

WORKDIR /app

COPY --from=build /app .

RUN yarn link

CMD /bin/ash
