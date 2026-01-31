// import { defaultOptions } from './../node_modules/yaml/index.d';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { readdirSync } from 'fs';
import path from 'path';
import { initModels } from './models/init-models';
import { sequelize } from './config/db.config';
import helmet from 'helmet';
import { limiter } from './middlewares/rateLimiter';
import redisService from './services/redis.service';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

dotenv.config();


// import authRoutes from './routes/auth.route';
// import employeeRoutes from './routes/employee.route';
// import userRoutes from './routes/user.route';
import indexRoutes from './routes/index';

// Placeholder for JWT authentication middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    // In a real application, this would verify the JWT token
    // For now, it just calls next()
    next();
};

class App {
    public app: express.Application;
    private corsOptions: cors.CorsOptions = {
        origin: ["http://localhost:5173", "http://localhost:3000"], // Replace with your allowed origins
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
        credentials: true,
    };
    private swaggerOptions = {
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
            ],            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },        },
        apis: ['./src/routes/*.ts'], // paths to files with annotations
    };

    constructor() {
        this.app = express();
        this.middleware()
        this.routes();
    }

    private middleware(): void {
        this.app.set('trust proxy', 1); // ✅ Fix express-rate-limit warning

        // ✅ Serve uploaded files publicly (e.g., /uploads/documents/xyz.pdf)
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

        this.app.use(this.requestLogger);
        this.app.use(cors(this.corsOptions));
        this.app.use(express.json({ limit: "50mb" }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        // this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(helmet({
            //contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: false,
        }));
        this.app.use(limiter);
    }

    private requestLogger(req: Request, res: Response, next: NextFunction): void {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.connection?.remoteAddress;
        const path = req.originalUrl || req.url;
        console.log(`Incoming request from IP: \x1b[35m%s\x1b[0m \x1b[36m%s\x1b[0m`, `${ip}`, `${path}`);
        next();
    }

    private routes(): void {
        // Mount index route
        //  this.app.use('/api', indexRoutes);

        // // Mount authentication routes
        // this.app.use('/api/auth', authRoutes);



        // // Mount employee and user routes with JWT authentication placeholder
        // this.app.use('/api/employees', authenticateJWT, employeeRoutes);
        // this.app.use('/api/users', authenticateJWT, userRoutes);
        // Health check routes
        this.app.get('/api/health', async (req: Request, res: Response) => {
            try {
                // Check database connection
                await sequelize.authenticate();

                // Check Redis connection
                let redisStatus = 'disconnected';
                try {
                    if (redisService.isClientConnected()) {
                        // await redisService.ping();
                        redisStatus = 'connected';
                    }
                } catch (error) {
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
            } catch (error) {
                res.status(500).json({
                    status: 'ERROR',
                    timestamp: new Date().toISOString(),
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        // Redis test routes (for development/testing)
        this.app.get('/api/redis/test', async (req: Request, res: Response) => {
            try {
                const testKey = 'test:connection';
                const testValue = 'Redis is working!';

                // Test set
                await redisService.set(testKey, testValue, 60); // 60 seconds TTL

                // Test get
                const retrievedValue = await redisService.get(testKey);

                res.json({
                    success: true,
                    message: 'Redis test completed',
                    data: {
                        set: testValue,
                        get: retrievedValue,
                        match: testValue === retrievedValue
                    }
                });
            } catch (error) {
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

        this.app.use('/api', indexRoutes);  

        // Swagger UI
        const specs = swaggerJsdoc(this.swaggerOptions);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
        
        // Default API route
        this.app.get('/api', (req: Request, res: Response) => {
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
        // this.app.use('*', (req: Request, res: Response) => {
        //     res.status(404).json({
        //         success: false,
        //         message: `Route ${req.originalUrl} not found`
        //     });
        // });

        // Global error handler
        this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
            console.error('Global error handler:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            });
        });



    }
}

export default new App().app;