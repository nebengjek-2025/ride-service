FROM node:20-alpine
 
RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot
 
RUN apk add --no-cache git python3 make g++

WORKDIR /usr/src/app
 
USER root
RUN chown -R nonroot:nonroot /usr/src/app
USER nonroot
 
COPY package*.json ./
COPY . .
 
USER root
RUN chown -R nonroot:nonroot /usr/src/app
USER nonroot
 
RUN npm install --ignore-scripts --omit=dev && npm cache clean --force
RUN npm install --ignore-scripts --omit=dev https://github.com/thrive-roadshow/all-in-one.git
RUN npm rebuild bcrypt --build-from-source
 
EXPOSE 9000
 
CMD ["npm", "start"]