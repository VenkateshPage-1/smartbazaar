FROM node:20-slim

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm install

COPY backend/ ./
RUN npx prisma generate

EXPOSE 4000
ENV PORT=4000

CMD ["node", "src/server.js"]
