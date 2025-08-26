import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

import { config } from './env';
import { logger } from './utils/logger';
import { db } from './db/client';
import { authenticateToken, initializeAdminUser } from './auth/middleware';

// Import routes
import authRoutes from './routes/auth';
import activitiesRoutes from './routes/activities';
import activitiesDetailedRoutes from './routes/activities-detailed';
import userJourneyRoutes from './routes/user-journey';
import statsRoutes from './routes/stats';
import usersRoutes from './routes/users';
import vendorsRoutes from './routes/vendors';
import vendorManagementRoutes from './routes/vendor-management';

const app = express();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Admin Activity Portal API',
      version: '1.0.0',
      description: 'API for viewing and managing user activities across the Dsalta platform',
      contact: {
        name: 'Dsalta Admin',
        email: config.ADMIN_EMAIL
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ActivityLogWithDetails: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string' },
            tenant_id: { type: 'string' },
            action: { type: 'string' },
            entity_type: { type: 'string' },
            entity_id: { type: 'string' },
            metadata: { type: 'object' },
            ip: { type: 'string' },
            user_agent: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            user_email: { type: 'string' },
            user_name: { type: 'string' },
            entity_name: { type: 'string' },
            organization_name: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS * 5, // Increase limit significantly
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for auth endpoints during development
    if (config.NODE_ENV === 'development' && req.path.startsWith('/api/auth')) {
      return true;
    }
    return false;
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await db.checkConnection();
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected',
      version: '1.0.0'
    };
    
    res.status(dbHealthy ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Admin Activity Portal API'
}));

// Serve swagger spec as JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/verify', authenticateToken, (req, res) => {
  // This endpoint is protected by the authenticateToken middleware
  // If we reach here, the token is valid
  const user = (req as any).user;
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});
app.use('/api/activities', authenticateToken, activitiesRoutes);
app.use('/api/activities-detailed', authenticateToken, activitiesDetailedRoutes);
app.use('/api/user-journey', authenticateToken, userJourneyRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/vendors', authenticateToken, vendorsRoutes);
app.use('/api/vendor-management', authenticateToken, vendorManagementRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Admin Activity Portal API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(config.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await db.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await db.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize admin user
    await initializeAdminUser();
    
    // Check database connection
    const dbHealthy = await db.checkConnection();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }
    
    logger.info('Database connection established');
    
    // Start HTTP server
    const server = app.listen(config.PORT, () => {
      logger.info(`Admin Activity Portal API running on port ${config.PORT}`);
      logger.info(`API Documentation: http://localhost:${config.PORT}/api/docs`);
      logger.info(`Health Check: http://localhost:${config.PORT}/health`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  startServer();
}

export default app;
