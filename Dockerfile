# Stage 1: Builder
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build the project
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:24-alpine AS production

WORKDIR /app

# 2.1 ตั้งค่า Timezone ของ Container ให้เป็นเวลาลาว (สำคัญมากสำหรับระบบการเงิน/Cron Job)
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Vientiane /etc/localtime && \
    echo "Asia/Vientiane" > /etc/timezone

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# ✅ เพิ่มบรรทัดนี้: สร้างโฟลเดอร์ logs และเปลี่ยนเจ้าของเป็น node
RUN mkdir logs && chown -R node:node /app

USER node

# Start the application
# 2.5 สั่งรันแอปพลิเคชัน

CMD ["node", "dist/server.js"]