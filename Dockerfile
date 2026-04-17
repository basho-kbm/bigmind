FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 10000

CMD ["sh", "-c", "npm run start -- -H 0.0.0.0 -p ${PORT:-10000}"]
