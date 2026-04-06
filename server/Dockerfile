FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install -g nodemon

COPY . .

ENV PORT=3000
ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "dev"]
