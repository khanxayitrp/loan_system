"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { defaultOptions } from './../node_modules/yaml/index.d';
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const db_config_1 = require("./config/db.config");
const helmet_1 = __importDefault(require("helmet"));
const rateLimiter_1 = require("./middlewares/rateLimiter");
const redis_service_1 = __importDefault(require("./services/redis.service"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const index_1 = __importDefault(require("./routes/index"));
// app.ts (ด้านบนสุด)
const errorHandler_1 = require("./middlewares/errorHandler"); // <-- Import middleware ของเรา
const errors_1 = require("./utils/errors"); // <-- Import Error Class สำหรับทำ 404
dotenv_1.default.config();
// import authRoutes from './routes/auth.route';
// import employeeRoutes from './routes/employee.route';
// import userRoutes from './routes/user.route';
// Placeholder for JWT authentication middleware
const authenticateJWT = (req, res, next) => {
    // In a real application, this would verify the JWT token
    // For now, it just calls next()
    next();
};
class App {
    constructor() {
        this.corsOptions = {
            origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000", 'http://192.168.101.118:5173'], // Replace with your allowed origins
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
            credentials: true,
        };
        this.swaggerOptions = {
            definition: {
                openapi: '3.0.0',
                info: {
                    title: 'My Node App API',
                    version: '1.0.0',
                    description: 'API documentation for My Node App',
                },
                servers: [
                    {
                        url: 'http://localhost:15520/api',
                        description: 'Development server',
                    },
                    {
                        url: 'http://192.168.101.89:15520/api', // 🟢 เพิ่ม IP วง LAN ของเครื่องเซิร์ฟเวอร์คุณเข้าไป
                        description: 'LAN Server'
                    }
                ], components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                        },
                    },
                },
            },
            apis: ['./src/routes/*.ts'], // paths to files with annotations
        };
        this.app = (0, express_1.default)();
        this.middleware();
        this.routes();
    }
    middleware() {
        this.app.set('trust proxy', 1); // ✅ Fix express-rate-limit warning
        // ✅ ເພີ່ມ timeout middleware ກ່ອນ routes
        this.app.use((req, res, next) => {
            // ບໍ່ໃຊ້ timeout ສຳລັບ PDF generation
            if (req.path.includes('/pdf') || req.path.includes('/generate')) {
                req.socket.setTimeout(120000); // 120 ວິນາທີ
            }
            else {
                req.socket.setTimeout(30000); // 30 ວິນາທີ ສຳລັບ request ທົ່ວໄປ
            }
            next();
        });
        // ✅ Serve uploaded files publicly (e.g., /uploads/documents/xyz.pdf)
        this.app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
        this.app.use(this.requestLogger);
        this.app.use((0, cors_1.default)(this.corsOptions));
        this.app.use(express_1.default.json({ limit: "50mb" }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use((0, cookie_parser_1.default)());
        // this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: false,
            hsts: false
        }));
        // ✅ ປັບ rate limiter ບໍ່ໃຫ້ block PDF requests
        // this.app.use((req, res, next) => {
        //     if (req.path.includes('/pdf') || req.path.includes('/generate')) {
        //         // ຂ້າມ rate limiter ສຳລັບ PDF generation
        //         heavyTaskLimiter(req, res, next);
        //     } else {
        //         globalLimiter(req, res, next);
        //     }
        // });
        // this.app.use(limiter);
    }
    requestLogger(req, res, next) {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.connection?.remoteAddress;
        const path = req.originalUrl || req.url;
        console.log(`Incoming request from IP: \x1b[35m%s\x1b[0m \x1b[36m%s\x1b[0m`, `${ip}`, `${path}`);
        next();
    }
    routes() {
        // Mount index route
        //  this.app.use('/api', indexRoutes);
        // // Mount authentication routes
        // this.app.use('/api/auth', authRoutes);
        // 1. ດັກໜ້າ Route ທີ່ກ່ຽວກັບ Login/Auth
        this.app.use('/api/auth/login', rateLimiter_1.authLimiter);
        this.app.use('/api/auth/refresh', rateLimiter_1.authLimiter);
        this.app.use('/api/pdf', rateLimiter_1.heavyTaskLimiter);
        this.app.use('/api/generate', rateLimiter_1.heavyTaskLimiter);
        // // Mount employee and user routes with JWT authentication placeholder
        // this.app.use('/api/employees', authenticateJWT, employeeRoutes);
        // this.app.use('/api/users', authenticateJWT, userRoutes);
        // Health check routes
        this.app.get('/api/health', async (req, res) => {
            try {
                // Check database connection
                await db_config_1.sequelize.authenticate();
                // Check Redis connection
                let redisStatus = 'disconnected';
                try {
                    if (redis_service_1.default.isClientConnected()) {
                        // await redisService.ping();
                        redisStatus = 'connected';
                    }
                }
                catch (error) {
                    redisStatus = 'error';
                }
                res.status(200).json({
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    services: {
                        database: 'connected',
                        redis: redisStatus
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    status: 'ERROR',
                    timestamp: new Date().toISOString(),
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Redis test routes (for development/testing)
        this.app.get('/api/redis/test', async (req, res) => {
            try {
                const testKey = 'test:connection';
                const testValue = 'Redis is working!';
                // Test set
                await redis_service_1.default.set(testKey, testValue, 60); // 60 seconds TTL
                // Test get
                const retrievedValue = await redis_service_1.default.get(testKey);
                res.json({
                    success: true,
                    message: 'Redis test completed',
                    data: {
                        set: testValue,
                        get: retrievedValue,
                        match: testValue === retrievedValue
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Redis test failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // const routesPath = path.join(__dirname, "./routes");
        // readdirSync(routesPath).forEach((file) => {
        //     // if (file.endsWith(".ts") || file.endsWith(".js")) {
        //     const isTypeScriptFile = file.endsWith(".ts") && !file.endsWith(".d.ts");
        //     const isJavaScriptFile = file.endsWith(".js") && !file.includes(".d.ts");
        //     if (isJavaScriptFile || isTypeScriptFile) {
        //         try {
        //             const route = require(path.join(routesPath, file)).default;
        //             this.app.use('/api', route);
        //         } catch (err) {
        //             console.error(`❌ Failed to load route file: ${file}`, err);
        //         }
        //     }
        // });
        this.app.use('/api', rateLimiter_1.globalLimiter, index_1.default);
        // Swagger UI
        const specs = (0, swagger_jsdoc_1.default)(this.swaggerOptions);
        this.app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
        // Default API route
        this.app.get('/api', (req, res) => {
            res.json({
                message: 'Welcome to the API',
                version: '1.0.0',
                endpoints: {
                    health: '/api/health',
                    redisTest: '/api/redis/test'
                }
            });
        });
        // // 404 handler
        // this.app.use((req: Request, res: Response) => {
        //     res.status(404).json({
        //         success: false,
        //         message: `Route ${req.originalUrl} not found`
        //     });
        // });
        // // Global error handler
        // this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
        //     console.error('Global error handler:', error);
        //     res.status(500).json({
        //         success: false,
        //         message: 'Internal server error',
        //         error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        //     });
        // });
        // ✅ 404 Handler แบบใหม่ (โยนเข้า Error Handler)
        this.app.use((req, res, next) => {
            // โยน NotFoundError ไปให้ Global Error Handler จัดการ
            next(new errors_1.NotFoundError(`Route ${req.originalUrl} not found`));
        });
        // ✅ Global error handler ตัวใหม่ที่เราเขียนไว้! (ต้องอยู่ล่างสุดเสมอ)
        this.app.use(errorHandler_1.errorHandler);
    }
}
exports.default = new App().app;
