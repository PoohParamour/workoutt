FROM node:22-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
VOLUME /app/data
ENV DB_PATH=/app/data/workout.db
EXPOSE 3000
CMD ["node", "server.js"]
