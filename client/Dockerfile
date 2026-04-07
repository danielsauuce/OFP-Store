FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "find node_modules -mindepth 1 -delete 2>/dev/null; npm install && npm run dev -- --host"]
