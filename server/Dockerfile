FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

ENV PORT=3000
ENV NODE_ENV=development

EXPOSE 3000

CMD ["sh", "-c", "[ -f node_modules/.package-lock.json ] || (rm -rf node_modules && npm install) && npm run dev"]
