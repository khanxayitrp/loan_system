import { createServer, Server as HttpServer, IncomingMessage, ServerResponse } from "http";
import { Server as SocketServer } from "socket.io";
import { logger } from "./utils/logger";
import app from "./app";
import PortService from "./services/Port.Service";
import redisService from "./services/redis.service";
import { createUploadDirectories } from "./utils/createUploadsDir";
import DailyTrackingService from './services/DailyTrackingService';
import ReminderCronService from "./services/ReminderCronService";

class ServerApp {
  private httpServer: HttpServer;
  private portService: PortService;
  private io: SocketServer;

  private PORT: number;
  constructor() {
    this.PORT = parseInt(process.env.PORT as string, 10);
    this.portService = new PortService();
    this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => app(req, res));
    this.io = new SocketServer(this.httpServer, { cors: { origin: "*" } });
    // this.setupGracefulShutdown();
    this.InitializeServer();
  }
  private async InitializeServer(): Promise<void> {
    try {
      // Initialize Redis connection
      await this.initializeRedis();

      await createUploadDirectories();

      // 🟢 ເປີດນຳໃຊ້ລະບົບ Tracking ອັດຕະໂນມັດ 🟢
       DailyTrackingService.startCronJob(); 

       ReminderCronService.startCronJob();

      // Start the HTTP server
      this.startServer();
      // this
    } catch (error) {
      logger.error("Failed to initialize server:", error);
      process.exit(1);
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      logger.info('Connecting to Redis...');
      await redisService.connect();

      logger.info('Redis connected successfully.');
    } catch (error) {
      logger.warn('Redis connection failed - continue with cache:', error);
      logger.warn('To enable Redis: docker run -d -p 6379:6379 --name redis redis:7-alpine')
    }
  }

  private startServer(): void {

    this.portService.findAvailablePort(this.PORT, (err: Error | null, availablePort?: number) => {
      if (err) {
        logger.error("Error finding available port:", err);
        process.exit(1);
      }
      app.set("port", availablePort);

      // ✅ ເພີ່ມ timeout ສຳລັບ HTTP Server
      this.httpServer.timeout = 120000; // 120 ວິນາທີ
      this.httpServer.keepAliveTimeout = 120000;
      this.httpServer.headersTimeout = 120000;

      this.httpServer.listen(availablePort, '0.0.0.0', () => {
        const HOST = process.env.HOST || 'localhost';
        logger.info(`🚀 Server running on: ➜ \u001b[34mhttp://${HOST}:${availablePort}\u001b[0m`);
        // แนะนำให้พิมพ์ IP ของวง LAN ออกมาดูด้วยเลย จะได้ก๊อปปี้ไปวางเครื่องอื่นง่ายๆ
        logger.info(`🌐 Network access: ➜ \u001b[34mhttp://0.0.0.0:${availablePort}\u001b[0m`);
        logger.info(`📊 Redis status: ${redisService.isClientConnected() ? '✅ Connected' : '❌ Disconnected'}`);
      });
    })
  }
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received - Starting graceful shutdown...`);

      try {
        // Close Redis connection
        await redisService.disconnect();

        // Close HTTP server
        this.httpServer.close(() => {
          logger.info('🔄 HTTP server closed');
          process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
          logger.error('⚠️ Forceful shutdown after timeout');
          process.exit(1);
        }, 10000);

      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }
}

export default new ServerApp();
