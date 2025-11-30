FROM node:20.11-alpine AS builder

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

RUN apk add --no-cache git python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./

USER root
RUN chown -R nonroot:nonroot /usr/src/app
USER nonroot

RUN npm install --omit=dev && npm cache clean --force

COPY --chown=nonroot:nonroot src/ ./src/
COPY --chown=nonroot:nonroot index.js ./

FROM node:20.11-alpine

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

WORKDIR /usr/src/app

COPY --chown=nonroot:nonroot --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=builder /usr/src/app/package*.json ./
COPY --chown=nonroot:nonroot --from=builder /usr/src/app/index.js ./
COPY --chown=nonroot:nonroot --from=builder /usr/src/app/src ./src

USER nonroot

EXPOSE 9000

CMD ["npm", "start"]
