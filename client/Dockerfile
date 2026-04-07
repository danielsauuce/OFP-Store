FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

ENV NODE_ENV=development

EXPOSE 5173

CMD ["sh", "-c", "npm install && ./node_modules/.bin/vite --host"]
