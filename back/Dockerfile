FROM --platform=linux/arm/v7 arm32v7/node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional
COPY . .
RUN npm run build

FROM --platform=linux/arm/v7 arm32v7/node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/ /app/dist/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules/ ./node_modules/
CMD ["node", "dist/src/main"]