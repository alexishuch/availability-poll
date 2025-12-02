FROM --platform=linux/arm/v7 arm32v7/node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
