"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const logger_1 = require("./utils/logger");
const app_1 = __importDefault(require("./app"));
const Port_Service_1 = __importDefault(require("./services/Port.Service"));
const redis_service_1 = __importDefault(require("./services/redis.service"));
const createUploadsDir_1 = require("./utils/createUploadsDir");
const DailyTrackingService_1 = __importDefault(require("./services/DailyTrackingService"));
const ReminderCronService_1 = __importDefault(require("./services/ReminderCronService"));
class ServerApp {
    constructor() {
        this.PORT = parseInt(process.env.PORT, 10);
        this.portService = new Port_Service_1.default();
        this.httpServer = (0, http_1.createServer)((req, res) => (0, app_1.default)(req, res));
        this.io = new socket_io_1.Server(this.httpServer, { cors: { origin: "*" } });
        // this.setupGracefulShutdown();
        this.InitializeServer();
    }
    async InitializeServer() {
        try {
            // Initialize Redis connection
            await this.initializeRedis();
            await (0, createUploadsDir_1.createUploadDirectories)();
            // 🟢 ເປີດນຳໃຊ້ລະບົບ Tracking ອັດຕະໂນມັດ 🟢
            DailyTrackingService_1.default.startCronJob();
            ReminderCronService_1.default.startCronJob();
            // Start the HTTP server
            this.startServer();
            // this
        }
        catch (error) {
            logger_1.logger.error("Failed to initialize server:", error);
            process.exit(1);
        }
    }
    async initializeRedis() {
        try {
            logger_1.logger.info('Connecting to Redis...');
            await redis_service_1.default.connect();
            logger_1.logger.info('Redis connected successfully.');
        }
        catch (error) {
            logger_1.logger.warn('Redis connection failed - continue with cache:', error);
            logger_1.logger.warn('To enable Redis: docker run -d -p 6379:6379 --name redis redis:7-alpine');
        }
    }
    startServer() {
        this.portService.findAvailablePort(this.PORT, (err, availablePort) => {
            if (err) {
                logger_1.logger.error("Error finding available port:", err);
                process.exit(1);
            }
            app_1.default.set("port", availablePort);
            // ✅ ເພີ່ມ timeout ສຳລັບ HTTP Server
            this.httpServer.timeout = 120000; // 120 ວິນາທີ
            this.httpServer.keepAliveTimeout = 120000;
            this.httpServer.headersTimeout = 120000;
            this.httpServer.listen(availablePort, '0.0.0.0', () => {
                const HOST = process.env.HOST || 'localhost';
                logger_1.logger.info(`🚀 Server running on: ➜ \u001b[34mhttp://${HOST}:${availablePort}\u001b[0m`);
                // แนะนำให้พิมพ์ IP ของวง LAN ออกมาดูด้วยเลย จะได้ก๊อปปี้ไปวางเครื่องอื่นง่ายๆ
                logger_1.logger.info(`🌐 Network access: ➜ \u001b[34mhttp://0.0.0.0:${availablePort}\u001b[0m`);
                logger_1.logger.info(`📊 Redis status: ${redis_service_1.default.isClientConnected() ? '✅ Connected' : '❌ Disconnected'}`);
            });
        });
    }
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received - Starting graceful shutdown...`);
            try {
                // Close Redis connection
                await redis_service_1.default.disconnect();
                // Close HTTP server
                this.httpServer.close(() => {
                    logger_1.logger.info('🔄 HTTP server closed');
                    process.exit(0);
                });
                // Force close after 10 seconds
                setTimeout(() => {
                    logger_1.logger.error('⚠️ Forceful shutdown after timeout');
                    process.exit(1);
                }, 10000);
            }
            catch (error) {
                logger_1.logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };
        // Handle different termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });
    }
}
exports.default = new ServerApp();
