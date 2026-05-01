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

# ✅ 2. เพิ่มส่วนนี้: ติดตั้ง Chromium, Fonts และ Library ที่ Puppeteer ต้องใช้
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# ✅ 3. บอกให้ Puppeteer ใช้ Chromium ของระบบแทนตัวที่มันโหลดมาเอง
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000 -g && \
    npm ci --omit=dev

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# ✅ 6. เพิ่มบรรทัดนี้: ก๊อปปี้โฟลเดอร์รูปภาพ (public) เข้ามาใน Docker ด้วย
COPY --from=builder /app/public ./public

# 1. ติดตั้ง PM2 แบบ Global ลงใน Docker
RUN npm install -g pm2

# 2. ก๊อปปี้ไฟล์ ecosystem.config.js ของคุณเข้าไปด้วย
COPY ecosystem.config.js ./

# ✅ เพิ่มบรรทัดนี้: สร้างโฟลเดอร์ logs และเปลี่ยนเจ้าของเป็น node
RUN mkdir logs && chown -R node:node /app

USER node

# Start the application
# 2.5 สั่งรันแอปพลิเคชัน

# CMD ["node", "dist/server.js"]
# 4. เปลี่ยนคำสั่งรันจาก node เป็น pm2-runtime
CMD ["pm2-runtime", "ecosystem.config.js"]