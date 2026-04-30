"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const redis_1 = require("redis");
class RedisService {
    constructor() {
        this.isConnected = false;
        // ກວດສອບວ່າມີ Password ຫຼື ບໍ່ ເພື່ອສ້າງ URL ໃຫ້ຖືກຕ້ອງ
        const host = process.env.REDIS_HOST || 'localhost';
        const port = process.env.REDIS_PORT || '6379';
        const password = process.env.REDIS_PASSWORD;
        // ຖ້າມີລະຫັດຜ່ານ ໃຫ້ເອົາລະຫັດໄປຍັດໃສ່ໃນ URL ນຳ
        const redisUrl = password
            ? `redis://:${password}@${host}:${port}`
            : `redis://${host}:${port}`;
        this.client = (0, redis_1.createClient)({
            url: redisUrl
        });
        // Properly typed error handler
        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
        this.client.on('connect', () => {
            console.log('Connected to Redis');
            this.isConnected = true;
        });
        this.client.on('disconnect', () => {
            console.log('Disconnected from Redis');
            this.isConnected = false;
        });
    }
    async connect() {
        try {
            if (!this.isConnected) {
                await this.client.connect();
            }
        }
        catch (error) {
            // Properly typed error handling
            const err = error;
            console.error('Failed to connect to Redis:', err.message);
            throw err;
        }
    }
    //   async ping(): Promise<string> {
    //   try {
    //     const result = await this.client.ping();
    //     return result; // Returns "PONG" if successful
    //   } catch (error: unknown) {
    //     const err = error as Error;
    //     console.error('Failed to ping Redis:', err.message);
    //     throw err;
    //   }
    // }
    // async gracefulShutdown(): Promise<void> {
    //   try {
    //     if (this.isConnected) {
    //       await this.client.quit(); // Use QUIT for graceful shutdown
    //       // logger.info('Redis client gracefully shut down');
    //     }
    //   } catch (error: unknown) {
    //     const err = error as Error;
    //     console.error('Failed to gracefully shut down Redis:', err.message);
    //     throw err;
    //   }
    // }
    async disconnect() {
        try {
            if (this.isConnected) {
                await this.client.disconnect();
            }
        }
        catch (error) {
            const err = error;
            console.error('Failed to disconnect from Redis:', err.message);
            throw err;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                return await this.client.setEx(key, ttlSeconds, value);
            }
            else {
                return await this.client.set(key, value);
            }
        }
        catch (error) {
            const err = error;
            console.error('Failed to set Redis key:', err.message);
            throw err;
        }
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            const err = error;
            console.error('Failed to get Redis key:', err.message);
            throw err;
        }
    }
    async del(key) {
        try {
            const result = await this.client.del(key);
            return Number(result);
        }
        catch (error) {
            const err = error;
            console.error('Failed to delete Redis key:', err.message);
            throw err;
        }
    }
    // เพิ่มเมธอดนี้ใน class RedisService
    async delByPattern(pattern) {
        if (!this.isConnected) {
            console.warn('Redis client is not connected. Skipping delByPattern.');
            return 0;
        }
        try {
            let deletedCount = 0;
            let cursor = '0';
            do {
                const result = await this.client.scan(cursor, {
                    MATCH: pattern,
                    COUNT: 100,
                });
                cursor = result.cursor;
                const keys = result.keys;
                if (Array.isArray(keys) && keys.length > 0) {
                    // แปลงเป็น array ชัดเจน และ spread ได้อย่างปลอดภัย
                    // const mutableKeys = keys.slice(); // หรือใช้ keys.slice()
                    const deleted = await this.client.del(keys);
                    deletedCount += deleted;
                    console.log(`Deleted ${deleted} keys matching pattern: ${pattern}`);
                }
            } while (cursor !== '0');
            return deletedCount;
        }
        catch (error) {
            const err = error;
            console.error('Failed to delete Redis keys by pattern:', err.message);
            throw err;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return Number(result) === 1;
        }
        catch (error) {
            const err = error;
            console.error('Failed to check Redis key existence:', err.message);
            throw err;
        }
    }
    async expire(key, seconds) {
        try {
            const result = await this.client.expire(key, seconds);
            return Boolean(result);
        }
        catch (error) {
            const err = error;
            console.error('Failed to set Redis key expiration:', err.message);
            throw err;
        }
    }
    async ttl(key) {
        try {
            const result = await this.client.ttl(key);
            return Number(result);
        }
        catch (error) {
            const err = error;
            console.error('Failed to get Redis key TTL:', err.message);
            throw err;
        }
    }
    // ເພີ່ມ Method ນີ້ລົງໃນ class RedisService ຂອງທ່ານ
    async setLock(key, value, ttlSeconds) {
        try {
            // NX: true ໝາຍເຖິງ Set if Not Exists (ຈະຂຽນຄ່າລົງໄດ້ກໍຕໍ່ເມື່ອບໍ່ມີ Key ນີ້ມາກ່ອນ)
            // EX: ttlSeconds ໝາຍເຖິງກຳນົດເວລາໝົດອາຍຸ
            const result = await this.client.set(key, value, {
                NX: true,
                EX: ttlSeconds
            });
            // ຖ້າຈອງ Lock ໄດ້ ມັນຈະຕອບກັບມາເປັນ 'OK'
            // ຖ້າມີຄົນຈອງແລ້ວ ມັນຈະຕອບກັບມາເປັນ null
            return result === 'OK';
        }
        catch (error) {
            const err = error;
            console.error('Failed to set Redis Lock:', err.message);
            return false; // ຖ້າ Error ໃຫ້ຖືວ່າຈອງບໍ່ໄດ້ ເພື່ອຄວາມປອດໄພ
        }
    }
    isClientConnected() {
        return this.isConnected;
    }
    getClient() {
        return this.client;
    }
}
// Export singleton instance
exports.redisService = new RedisService();
exports.default = exports.redisService;
