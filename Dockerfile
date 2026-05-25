# Stage 1: Builder
# ໝາຍເຫດ: ຖ້າ node:24-alpine ມີບັນຫາຫາ package ບໍ່ເຫັນ, ແນະນຳໃຫ້ປ່ຽນເປັນ node:22-alpine ຫຼື node:20-alpine
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

# 2.1 ຕັ້ງຄ່າ Timezone ຂອງ Container ໃຫ້ເປັນເວລາລາວ (ສຳຄັນຫຼາຍສຳລັບລະບົບການເງິນ/Cron Job)
RUN apk update && apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Vientiane /etc/localtime && \
    echo "Asia/Vientiane" > /etc/timezone

# ✅ 2. ຕິດຕັ້ງ Chromium, Fonts (ສະໜັບສະໜູນພາສາລາວ) ແລະ Library ທີ່ Puppeteer & SOAP ຕ້ອງໃຊ້
# ປ່ຽນ ttf-freefont ເປັນ font-noto ແລະ font-noto-lao ເພື່ອບໍ່ໃຫ້ເກີດ Error ແລະ ອ່ານພາສາລາວໄດ້ດີ
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    font-noto \
    font-noto-lao \
    font-noto-thai \
    openjdk11-jre

# ✅ 3. ບອກໃຫ້ Puppeteer ໃຊ້ Chromium ຂອງລະບົບແທນຕົວທີ່ມັນໂຫລດມາເອງ
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000 -g && \
    npm ci --omit=dev

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# ✅ 6. ກ໊ອບປີ້ໂຟເດີ້ຮູບພາບ (public) ເຂົ້າມາໃນ Docker 
COPY --from=builder /app/public ./public

# ✨ 7. (สำคัญ) ກ໊ອບປີ້ໄຟລ໌ encrypt.jar ມາໄວ້ໃນ Production ນຳ 
COPY --from=builder /app/src/utils/encrypt.jar ./src/utils/encrypt.jar

# 1. ຕິດຕັ້ງ PM2 ແບບ Global ລົງໃນ Docker
RUN npm install -g pm2

# 2. ກ໊ອບປີ້ຟາຍ ecosystem.config.js ຂອງເຮົາເຂົ້າມາໃນ docker
COPY ecosystem.config.js ./

# ✅ 8. ສ້າງໂຟເດີ້ logs ແລະ ປ່ຽນເຈົ້າຂອງເປັນ node
RUN mkdir logs && chown -R node:node /app

USER node

# 4. ປ່ຽນຄຳສັ່ງລັນ node ເປັນ pm2-runtime
CMD ["pm2-runtime", "ecosystem.config.js"]