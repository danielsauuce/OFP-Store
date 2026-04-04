FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

ENV PORT=3000
ENV NODE_ENV=production

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "server.js"]
